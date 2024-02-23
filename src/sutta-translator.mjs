import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { default as DeepLAdapter } from "./deepl-adapter.mjs"
import { default as QuoteParser } from "./quote-parser.mjs"
import pkgMemoAgain from "memo-again"
const {
  Files
} = pkgMemoAgain;

import pkgScvBilara from "scv-bilara";
const { 
  BilaraData, 
  BilaraPathMap,
  Seeker,
} = pkgScvBilara;

import pkgScvEsm from 'scv-esm';
const {
  SuttaRef,
} = pkgScvEsm;

import {
  DBG_CREATE, DBG_FIND, DBG_LOAD_SUTTA, DBG_TRANSLATE,
  DBG_TRANSFORM,
} from './defines.mjs'

var creating = false;

const DST_LANG = 'pt-PT';
const SRC_LANG = 'en';
const SRC_AUTHOR = 'sujato';
const DST_AUTHOR = 'ebt-deepl';
const LDQUOT = '“';
const RDQUOT = '”';
const LSQUOT = '‘';
const RSQUOT = '’';

export default class SuttaTranslator {
  constructor(opts={}) {
    const msg = 'SuttaTranslator.ctor()';

    if (!creating) {
      throw new Error(`${msg} use SuttaTranslator.create()`);
    }

    Object.assign(this, opts);
  }

  static async create(opts={}) {
    const msg = 'SuttaTranslator.create()';
    const dbg = DBG_CREATE || DBG_TRANSFORM;
    let {
      appendWhitespace=true, // SC requirement
      dstLang=DST_LANG,
      srcLang=SRC_LANG,
      srcAuthor = SRC_AUTHOR,
      dstAuthor=DST_AUTHOR,
      srcTransform,
      dstTransform,
      xltDeepL,
      bilaraData = await new BilaraData({
        name: 'ebt-data',
      }).initialize(),
      updateGlossary,
    } = opts;

    srcLang = srcLang.toLowerCase();
    dstLang = dstLang.toLowerCase();
    let srcLang2 = srcLang.split('-')[0];
    let dstLang2 = dstLang.split('-')[0];

    if (srcTransform == null || typeof srcTransform === 'string') {
      let xfmName = srcTransform || `src_${srcLang2}.json`;
      let xfmPath = path.join(__dirname, 'glossary', xfmName);
      let xfmBuf =  await fs.promises.readFile(xfmPath).catch(e=>null)
      if (xfmBuf) {
        dbg && console.log(msg, '[1]srcTransform', xfmName);
        let xfm = JSON.parse(xfmBuf);
        let xfmKeys = Object.keys(xfm);
        srcTransform = xfmKeys.reduce((a,key)=>{
          a.push({
            rex: new RegExp(`\\b${key}`, 'g'),
            rep: xfm[key],
          });
          return a;
        }, []);
      }
    }

    if (dstTransform == null || typeof dstTransform === 'string') {
      let xfmName = dstTransform || 
        `dst_${srcLang2}_${dstLang}.json`;
      let xfmPath = path.join(__dirname, 'glossary', xfmName);
      let xfmBuf =  await fs.promises.readFile(xfmPath).catch(e=>null)
      if (xfmBuf) {
        let xfm = JSON.parse(xfmBuf);
        let xfmKeys = Object.keys(xfm);
        dstTransform = xfmKeys.reduce((a,key)=>{
          a.push({
            rex: new RegExp(`${key}`, 'g'),
            rep: xfm[key],
          });
          return a;
        }, []);
        dbg && console.log(msg, '[1]dstTransform', xfmName, 
          dstTransform);
      }
    }

    if (xltDeepL == null) {
      let optsDeepL = { 
        srcLang,
        srcAuthor,
        dstLang,
        dstAuthor,
        updateGlossary,
      }
      dbg && console.log(msg, '[2]DeepLAdapter.create', optsDeepL);
      xltDeepL = await DeepLAdapter.create(optsDeepL);
    }

    let stOpts = {
      appendWhitespace,
      xltDeepL,
      srcLang,  // 'en', 'en-us', 'en-uk', 'en-deepl', ...
      srcLang2, // e.g., 'en' vs. 'en-us'
      srcAuthor,
      srcTransform,
      dstTransform,
      dstLang, // e.g., 'pt-br', 'pt-pt'
      dstLang2,
      dstAuthor,
      bilaraData,
    }
    switch (srcLang) {
      case 'en': {
        stOpts.qpSrc = new QuoteParser({lang:'en-us'});
        stOpts.qpPre = new QuoteParser({lang:'en-deepl'});
      } break;
    }
    switch (dstLang) {
      case 'pt-pt': 
        stOpts.qpPost = new QuoteParser({lang:'pt-deepl'});
        stOpts.qpDst = new QuoteParser({lang:'pt-pt'});
        break;
      case 'pt-br':
        stOpts.qpPost = new QuoteParser({lang:'pt-deepl'});
        stOpts.qpDst = new QuoteParser({lang:'pt-br'});
        break;
      case 'pt':
        stOpts.qpPost = new QuoteParser({lang:'pt-deepl'});
        stOpts.qpDst = dstAuthor === 'ebt-deepl'
          ? new QuoteParser({lang:'pt-pt'})
          : new QuoteParser({lang:'pt-br'});
        break;
      case 'fr': 
        stOpts.qpPost = new QuoteParser({lang:'fr-deepl'});
        stOpts.qpDst = new QuoteParser({lang:'fr'});
        break;
      default:
        stOpts.qpPost = new QuoteParser({lang:`${dstLang2}-deepl`});
        stOpts.qpDst = new QuoteParser({lang:dstLang});
        break;
    }

    let st;
    try {
      creating = true;
      dbg && console.log(msg, '[3]SuttaTranslator', 
        `${srcLang}/${srcAuthor} => ${dstLang}/${dstAuthor}`);
      st = new SuttaTranslator(stOpts);
    } finally {
      creating = false;
    }

    return st;
  }

  static curlyQuoteText(text, state={}) {
    const msg = 'SuttaTranslator.curlyQuoteText()';
    const rex = /["']/g;
    let { single=0, double=0 } = state;
    let match;
    let parts = text.split(rex);
    let quoted = [];
    while ((match = rex.exec(text)) !== null) {
      let quote = match[0];
      let { lastIndex } = rex;
      let pos = lastIndex-1;
      switch (quote) {
        case '"':
          quoted.push(parts.shift());
          if (double < 1) {
            quoted.push(LDQUOT);
            double++;
          } else {
            quoted.push(RDQUOT);
            double--;
          }
          break;
        case "'":
          quoted.push(parts.shift());
          if (single < 1) {
            quoted.push(LSQUOT);
            single++;
          } else {
            quoted.push(RSQUOT);
            single--;
          }
          break;
      }
    }
    if (parts.length) {
      quoted.push(parts[0]);
    }

    return {
      scText: quoted.join(''),
      state: { single, double }
    }
  }

  static curlyQuoteSegments(segsIn) {
    let scids = Object.keys(segsIn);
    let state;
    let segsOut = scids.reduce((a,scid) => {
      let text = segsIn[scid];
      let res = this.curlyQuoteText(text, state);
      a[scid] = res.scText;
      state = res.state;
      return a;
    }, {});
    return segsOut;
  }

  static titleCase(text) {
    let iLetter = text.search(/\w/);
    if (iLetter < 0) {
      return text;
    }
    return text.substring(0, iLetter) +
      text.charAt(iLetter).toUpperCase() +
      text.substring(iLetter+1);
  }

  static transformText(text, transform) {
    let xfmText = text;
    if (transform) {
      transform.forEach(xfm=>{
        xfmText = xfmText.replaceAll(xfm.rex, xfm.rep)
      });
    }
    return xfmText;
  }

  static async loadSutta(suttaRef, opts={}) {
    const msg = 'SuttaTranslator.loadSutta()';
    const dbg = DBG_LOAD_SUTTA;
    const { srcTransform, bilaraData, } = opts;
    if ( bilaraData == null) {
      let emsg = `${msg} bilaraData is required`;
      throw new Error(emsg);
    }
    let sref = SuttaRef.create(suttaRef);
    let { sutta_uid, lang='pli', author='ms' } = sref;
      let { root, bilaraPathMap:bpm } = bilaraData;
      let bilaraPath = lang==='pli'
      ? bpm.suidPath(sutta_uid)
      : bpm.suidPath(`${sutta_uid}/${lang}/${author}`);
    try {
      var filePath = path.join(root, bilaraPath);
      var rawText = (await fs.promises.readFile(filePath)).toString();
      var xfmText = SuttaTranslator
        .transformText(rawText, srcTransform);
      dbg && console.log(msg, {rawText,xfmText});
      var segments = JSON.parse(xfmText);
    } catch(e) {
      dbg && console.log(msg, '[1]not found:', sref, bilaraPath, e);
    }

    return {
      sutta_uid,
      lang, 
      author,
      bilaraPath,
      filePath,
      segments, 
    }
  }

  async loadSutta(suttaRef, opts={}) {
    let { 
      srcTransform = this.srcTransform, 
      bilaraData = this.bilaraData,
    } = opts;

    return SuttaTranslator.loadSutta(suttaRef, {
      srcTransform,
      bilaraData,
    });
  }

  async translateTexts(srcTexts) {
    const msg = 'SuttaTranslator.translateTexts()';
    const dbg = DBG_TRANSLATE;
    let { xltDeepL } = this;
    let preTexts = this.preTranslate(srcTexts);
    dbg && console.log(msg, '[1]preTexts', preTexts);
    let postTexts = await xltDeepL.translate(preTexts);
    dbg && console.log(msg, '[2]postTexts', postTexts);
    let dstTexts = this.postTranslate(postTexts);
    dbg && console.log(msg, '[3]dstTexts', dstTexts);

    return dstTexts;
  }

  async translate(suid) {
    const msg = 'SuttaTranslator.translate()';
    const dbg = DBG_TRANSLATE;
    const sref = SuttaRef.create(suid);
    const { sutta_uid, lang, author, segnum } = sref;
    let { 
      seeker, srcLang, srcAuthor, dstLang2, dstAuthor, 
      bilaraData, xltDeepL,
    } = this;
    let { root, bilaraPathMap:bpm } = bilaraData;
    let srcRef = SuttaRef.create({
      sutta_uid, lang: srcLang, author: srcAuthor});
    let {
      segments: srcSegs,
      filePath: srcPath,
    } = await this.loadSutta(srcRef);
    if (srcSegs == null) {
      let emsg = new Error(`${msg} cannot load: ${srcRef}`);
      throw new Error(emsg);
    }
    let scids = Object.keys(srcSegs);
    if (segnum) {
      scids = [ `${sutta_uid}:${segnum}` ]
    }
    let srcTexts = scids.map(scid=>srcSegs[scid]);

    dbg && console.log(msg, '[1]translate', 
      srcRef.toString(), `segs:${scids.length}`);
    let dstTexts = await this.translateTexts(srcTexts);
    let dstSegs = scids.reduce((a,scid,i)=>{
      a[scid] = /:0/.test(scid)
        ? SuttaTranslator.titleCase(dstTexts[i])
        : dstTexts[i];
      return a;
    }, {});
    let dstRef = SuttaRef.create(sutta_uid, dstLang2);
    dstRef.author = dstAuthor;
    let dstPath = bpm.suidPath(sutta_uid);
    dstPath = dstPath
      .replace('_root-pli-ms', `_translation-${dstLang2}-${dstAuthor}`)
      .replace('root/pli/', `translation/${dstLang2}/`)
      .replace('/ms/', `/${dstAuthor}/`);
    dstPath = dstPath && path.join(root, dstPath);

    return {
      srcRef, srcPath, srcSegs,
      dstRef, dstPath, dstSegs,
    }
  }

  preTranslate(srcTexts) {
    const msg = 'SuttaTranslator.preTranslate()';
    const dbg = 0;
    let { qpSrc, qpPre } = this;
    if (qpSrc == null) {
      dbg && console.log(msg, '[1]no_qpSrc');
      return srcTexts;
    }
    return srcTexts.map((srcText,i)=>{
      let level = qpSrc.quotationLevel(srcText);
      let dstText =  qpSrc.convertQuotes(srcText, qpPre, level);
      dbg && console.log(msg, `[2]convertQuotes${level}`, dstText);
      return dstText;
    });
  }

  postTranslate(xltTexts) {
    const msg = 'SuttaTranslator.postTranslate()';
    const dbg = DBG_TRANSFORM;
    let { 
      dstTransform, appendWhitespace, qpPost, qpDst 
    } = this;
    if (qpPost == null) {
      return xltTexts;
    }

    return xltTexts.map((xltText,i)=>{
      let level = qpPost.quotationLevel(xltText);
      let quoteText = qpPost.convertQuotes(xltText, qpDst, level);
      let outText = SuttaTranslator
        .transformText(quoteText, dstTransform);
     
      if (dbg && outText !== quoteText) {
        console.log(msg, '[1]transformText', {quoteText, outText});
      }
      if (appendWhitespace && !xltText.endsWith(' ')) {
        outText = outText + ' ';
      }
      return outText;
    });
  }
  
}
