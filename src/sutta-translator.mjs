import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { default as DeepLTranslator } from "./deepl.mjs"
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
} from './defines.mjs'

var creating = false;

const DST_LANG = 'pt';
const SRC_LANG = 'de';
const SRC_AUTHOR = 'sabbamitta';
const DST_AUTHOR = 'edited-ml';

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
    const dbg = DBG_CREATE;
    let {
      dstLang=DST_LANG,
      srcLang=SRC_LANG,
      srcAuthor = SRC_AUTHOR,
      dstAuthor=DST_AUTHOR,
      srcTransform,
      xltDeepL,
      bilaraData = await new BilaraData({
        name: 'ebt-data',
      }).initialize(),
    } = opts;

    if (srcTransform == null || typeof srcTransform === 'string') {
      let xfmName = srcTransform || `transform_${srcLang}.json`;
      let xfmPath = path.join(__dirname, 'glossary', xfmName);
      let xfmBuf =  await fs.promises.readFile(xfmPath).catch(e=>null)
      if (xfmBuf) {
        dbg && console.log(msg, '[1]srcTransform', xfmName);
        let xfm = JSON.parse(xfmBuf);
        let xfmKeys = Object.keys(xfm);
        srcTransform = xfmKeys.reduce((a,key)=>{
          a.push({
            rex: new RegExp(`\\b${key}`, 'ig'),
            rep: xfm[key],
          });
          return a;
        }, []);
      }
    }

    if (xltDeepL == null) {
      let optsDeepL = { 
        srcLang,
        dstLang,
      }
      dbg && console.log(msg, '[2]DeepLTranslator.create', optsDeepL);
      xltDeepL = await DeepLTranslator.create(optsDeepL);
    }

    let st;
    try {
      creating = true;
      dbg && console.log(msg, '[3]SuttaTranslator', 
        `${srcLang}/${srcAuthor} => ${dstLang}/${dstAuthor}`);
      st = new SuttaTranslator({
        xltDeepL,
        srcLang,
        srcAuthor,
        srcTransform,
        dstLang,
        dstAuthor,
        bilaraData,
      });
    } finally {
      creating = false;
    }

    return st;
  }

  static transformSource(text, srcTransform) {
    let xfmText = text;
    if (srcTransform) {
      srcTransform.forEach(xfm=>{
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
        .transformSource(rawText, srcTransform);
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

  async translate(sutta_uid) {
    const msg = 'SuttaTranslator.translate()';
    const dbg = DBG_TRANSLATE;
    let { 
      seeker, srcLang, srcAuthor, dstLang, dstAuthor, 
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
    let srcTexts = scids.map(scid=>srcSegs[scid]);

    dbg && console.log(msg, '[1]translate', 
      srcRef.toString(), scids.length);
    let dstTexts = await xltDeepL.translate(srcTexts);
    let dstSegs = scids.reduce((a,scid,i)=>{
      a[scid] = dstTexts[i];
      return a;
    }, {});
    let dstRef = SuttaRef.create(sutta_uid, dstLang);
    dstRef.author = dstAuthor;
    let dstPath = bpm.suidPath(sutta_uid);
    dstPath = dstPath
      .replace('_root-pli-ms', `_translation-${dstLang}-${dstAuthor}`)
      .replace('root/pli/', `translation/${dstLang}/`)
      .replace('/ms/', `/${dstAuthor}/`);
    dstPath = dstPath && path.join(root, dstPath);

    return {
      srcRef, srcPath, srcSegs,
      dstRef, dstPath, dstSegs,
    }
  }

}
