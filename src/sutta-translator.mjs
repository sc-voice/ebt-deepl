import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { default as DeepLAdapter } from "./deepl-adapter.mjs"
import { default as QuoteParser } from "./quote-parser.mjs"
import scvBilara from "scv-bilara";
const { Pali } = scvBilara;
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
  DBG,
  DBG_FIND, 
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
var PALI_WORDS;

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
    const dbg = DBG.SUTTA_XLT;
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
      updateGlossary=false,
    } = opts;

    srcLang = srcLang.toLowerCase();
    dstLang = dstLang.toLowerCase();
    let srcLang2 = srcLang.split('-')[0];
    let dstLang2 = dstLang.split('-')[0];

    await SuttaTranslator.paliWords();

    if (srcTransform == null || typeof srcTransform === 'string') {
      let srcXfmName = srcTransform || `src_${srcLang2}.json`;
      let xfmPath = path.join(__dirname, 'glossary', srcXfmName);
      dbg && console.log(msg, '[1]srcXfmName', srcXfmName);
      let xfmBuf =  await fs.promises.readFile(xfmPath).catch(e=>null)
      if (xfmBuf) {
        let xfm = JSON.parse(xfmBuf);
        let xfmKeys = Object.keys(xfm);
        srcTransform = xfmKeys.reduce((a,key)=>{
          a.push({
            rex: new RegExp(`${key}`, 'g'),
            rep: xfm[key],
          });
          return a;
        }, []);
      }
    }

    if (dstTransform == null || typeof dstTransform === 'string') {
      let dstXfmName = dstTransform || 
        `dst_${srcLang2}_${dstLang}.json`;
      let xfmPath = path.join(__dirname, 'glossary', dstXfmName);
      dbg && console.log(msg, '[2]dstXfmName', dstXfmName);
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
      dbg && console.log(msg, '[3]DeepLAdapter.create', 
        `${srcLang}/${srcAuthor} => ${dstLang}/${dstAuthor}`);
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
      case 'es':
        stOpts.qpPost = new QuoteParser({lang:`${dstLang2}-deepl`});
        stOpts.qpDst = new QuoteParser({lang:dstLang});
        break;
      default:
        stOpts.qpPost = new QuoteParser({lang:`${dstLang2}-deepl`});
        stOpts.qpDst = new QuoteParser({lang:dstLang});
        break;
    }
    if (stOpts.qpSrc == null) {
      switch (srcLang) {
        case 'en': {
          stOpts.qpSrc = new QuoteParser({lang:'en-us'});
          stOpts.qpPre = new QuoteParser({lang:'en-deepl'});
        } break;
      }
    }

    let st;
    try {
      creating = true;
      dbg && console.log(msg, '[4]quotes', [
        stOpts.qpSrc ? stOpts.qpSrc.lang : "n/a",
        stOpts.qpPre ? stOpts.qpPre.lang : "n/a",
        "DEEPL",
        stOpts.qpPost ? stOpts.qpPost.lang : "n/a",
        stOpts.qpDst ? stOpts.qpDst.lang : "n/a",
      ].join("=>"));
      st = new SuttaTranslator(stOpts);
    } finally {
      creating = false;
    }

    return st;
  }

  static isTitle(scid) { 
    return /(.*:[-0-9.]+\.0|:0)/.test(scid); 
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

  static async paliWords() {
    if (PALI_WORDS == null) {
      PALI_WORDS = await Pali.wordSet();
    }
    return PALI_WORDS;
  }

  static titleCase(text) {
    const msg = "SuttaTranslator.titleCase()";
    const dbg = DBG.TITLE;
    let lText = text.toLowerCase();
    let uText = text.toUpperCase();
    for (let i=0; i<text.length; i++) {
      let lc = lText.charAt(i);
      let uc = uText.charAt(i);
      if (lc !== uc) {
        text = lText.replace(lc,uc);
        break;
      }
    }
    let words = text.split(' ');
    let title = words.reduce((a,word)=>{
      if (word.length>4 && PALI_WORDS.contains(word)) {
        let c = word.charAt(0);
        word = word.replace(c,c.toUpperCase());
        dbg && console.log(msg, '[1]Pali', word);
      }
      return a ? `${a} ${word}` : word;
    }, undefined);
    return title;
  }

  static transformText(text, transform=[]) {
    const msg = "SuttaTranslator.transformText()";
    const dbg = DBG.TRANSFORM;
    const dbgv = DBG.VERBOSE;
    let xfmText = text;
    dbgv && console.log(msg, '[1]transform', transform);
    if (transform) {
      transform.forEach(xfm=>{
        xfmText = xfmText.replaceAll(xfm.rex, xfm.rep);
        if (dbg && text !== xfmText) {
          console.log(msg, '[2]replaceAll', xfm.rep);
        }
      });
    }
    return xfmText;
  }

  static async loadSutta(suttaRef, opts={}) {
    const msg = 'SuttaTranslator.loadSutta()';
    const dbg = DBG.LOAD_SUTTA;
    const dbgv = DBG.VERBOSE && dbg;
    const { srcTransform, bilaraData, } = opts;
    if ( bilaraData == null) {
      let emsg = `${msg} bilaraData is required`;
      throw new Error(emsg);
    }
    let sref = SuttaRef.create(suttaRef);
    let scids;
    let { sutta_uid, lang='pli', author='ms' } = sref;
      let { root, bilaraPathMap:bpm } = bilaraData;
      let bilaraPath = lang==='pli'
      ? bpm.suidPath(sutta_uid)
      : bpm.suidPath(`${sutta_uid}/${lang}/${author}`);
    try {
      var filePath = path.join(root, bilaraPath);
      var rawText = (await fs.promises.readFile(filePath)).toString();
      var segments = JSON.parse(rawText);
      scids = Object.keys(segments);
      scids.forEach(scid=>{
        if (SuttaTranslator.isTitle(scid)) {
          segments[scid] = segments[scid].toLowerCase();
          dbg && console.log(msg, '[2]toLowerCase', scid, segments[scid]);
        }
      });
    } catch(e) {
      dbg && console.log(msg, '[3]ERROR:', sref, bilaraPath, e);
    }

    return {
      sutta_uid,
      lang, 
      author,
      bilaraPath,
      filePath,
      segments, 
      scids,
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
    const dbg = DBG.SUTTA_XLT;
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
    const dbg = DBG.SUTTA_XLT;
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
      scids,
    } = await this.loadSutta(srcRef);
    if (srcSegs == null) {
      let emsg = new Error(`${msg} cannot load: ${srcRef}`);
      throw new Error(emsg);
    }
    if (segnum) {
      scids = [ `${sutta_uid}:${segnum}` ]
    }
    let srcTexts = scids.map(scid=>srcSegs[scid]);

    dbg && console.log(msg, '[1]translate', 
      srcRef.toString(), `segs:${scids.length}`);
    let dstTexts = await this.translateTexts(srcTexts);
    let dstSegs = scids.reduce((a,scid,i)=>{
      a[scid] = SuttaTranslator.isTitle(scid)
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
    const dbg = DBG.PRE_XLT;
    let { srcTransform, qpSrc, qpPre } = this;
    if (qpSrc == null) {
      dbg && console.log(msg, '[1]no_qpSrc');
      return srcTexts;
    }
    let level = 0;
    return srcTexts.map((srcText,i)=>{
      //level = qpSrc.quotationLevel(srcText);

      let check = qpSrc.syncQuoteLevel(srcText, level);
      level = check.startLevel;
      var xfmText = SuttaTranslator
        .transformText(srcText, srcTransform);
      dbg && console.log(msg, `[2]srcTransform`, xfmText, level);
      let dstText =  qpSrc.convertQuotes(xfmText, qpPre, level);
      //let dstText =  qpSrc.convertQuotes(srcText, qpPre, level);
      dbg && console.log(msg, `[3]convertQuotes${level}`, dstText);
      return dstText;
    });
  }

  postTranslate(xltTexts) {
    const msg = 'SuttaTranslator.postTranslate()';
    const dbg = DBG.TRANSFORM;
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
