import path from 'path';
import fs from 'fs';
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
  DBG_CREATE, DBG_FIND,
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
      xltDeepL,
      bilaraData = await new BilaraData({
        name: 'ebt-data',
      }).initialize(),
    } = opts;

    if (xltDeepL == null) {
      let optsDeepL = { 
        srcLang,
        dstLang,
      }
      dbg && console.log(msg, '[1]DeepLTranslator.create', optsDeepL);
      xltDeepL = await DeepLTranslator.create(optsDeepL);
    }

    let st;
    try {
      creating = true;
      st = new SuttaTranslator({
        xltDeepL,
        dstLang,
        srcLang,
        dstAuthor,
        srcAuthor,
        bilaraData,
      });
    } finally {
      creating = false;
    }

    return st;
  }

  async translate(suttaRef) {
    const msg = 'SuttaTranslator.translate()';
    let { 
      seeker, srcLang, srcAuthor, dstLang, dstAuthor, 
      bilaraData, xltDeepL,
    } = this;
    let { root, bilaraPathMap:bpm } = bilaraData;
    let srcRef = SuttaRef.create(suttaRef, srcLang);
    let { sutta_uid, lang=srcLang, author=srcAuthor } = srcRef;
    let srcPath = bpm.suidPath(`${sutta_uid}/${lang}/${author}`);
    srcPath = path.join(root, srcPath);
    let srcSegs = JSON.parse(await fs.promises.readFile(srcPath));
    let scids = Object.keys(srcSegs);
    let srcTexts = scids.map(scid=>srcSegs[scid]);

    let resXlt = await xltDeepL.translate(srcTexts);
    let dstTexts = resXlt.map(r=>r.text);
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
