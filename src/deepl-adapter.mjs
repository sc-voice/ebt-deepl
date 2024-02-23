import fs from "fs";
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cwd = process.cwd();

import {
  DBG_GLOSSARY, DBG_CREATE, DBG_VERBOSE, DBG_TRANSLATE,
  DBG_MOCK_API, 
} from './defines.mjs'
import * as deepl from 'deepl-node';
import { default as MockDeepL } from './mock-deepl.mjs';

const EMPTY_TEXT = "911911911";
const TRANSLATE_OPTS = {
  tagHandling: 'xml',
  formality: 'more',
}

var mockApi = DBG_MOCK_API;

export default class DeepLAdapter {
  constructor(opts={}) {
    let {
      authFile,
      glossary,
      glossaryName,
      initialized,
      sourceLang, // deepl lang
      targetLang,// deepl lang
      translateOpts,
      translator,
      dstLang,
      dstLang2, // bilara-data lang
      srcLang2, // bilara-data lang
      srcLang,
    } = DeepLAdapter.srcDstLangs(opts);

    let emsg = 'use DeepLAdapter.create()';
    let check = 1;
    if (null == authFile) throw new Error(`${emsg} ${check}`);
    check++;
    if (null == dstLang2) throw new Error(`${emsg} ${check}`);
    check++;
    if (null == glossaryName) throw new Error(`${emsg} ${check}`);
    check++;
    if (null == initialized) throw new Error(`${emsg} ${check}`);
    check++;
    if (null == sourceLang) throw new Error(`${emsg} ${check}`);
    check++;
    if (null == targetLang) throw new Error(`${emsg} ${check}`);
    check++;
    if (null == srcLang2) throw new Error(`${emsg} ${check}`);
    check++;
    if (null == translateOpts) throw new Error(`${emsg} ${check}`);
    check++;
    if (null == translator) throw new Error(`${emsg} ${check}`);
    check++;

    Object.assign(this, {
      authFile,
      dstLang,
      dstLang2,
      glossary,
      glossaryName,
      initialized,
      srcLang,
      srcLang2,
      sourceLang,
      targetLang,
      translateOpts: JSON.parse(JSON.stringify(translateOpts)),
      translator,
    });
  }

  static authKey(opts={}) {
    let {
      authFile=path.join(cwd,'local/deepl.auth'),
    } = opts;

    return fs.readFileSync(authFile).toString().trim();
  }

  static srcDstLangs(opts={}) {
    let { srcLang='en', dstLang='pt-pt' } = opts;
    srcLang = srcLang.toLowerCase();
    let srcLang2 = srcLang.split('-')[0];
    dstLang = dstLang.toLowerCase();
    let dstLang2 = dstLang.split('-')[0];

    return Object.assign({}, 
      opts, 
      { srcLang, srcLang2, dstLang, dstLang2 });
  }

  static deeplLang(lang) {
    switch (lang) {
      case 'pt': return 'pt-PT';
      default: return lang;
    }
  }

  static glossaryName(opts={}) {
    const msg = 'DeepLAdapter.glossaryName()';
    const dbg = DBG_GLOSSARY;
    let {
      dstAuthor='ebt-deepl',
    } = opts;
    let {
      dstLang,
      dstLang2, // bilara-data lang
      srcLang2, // bilara-data lang
      srcLang,
    } = DeepLAdapter.srcDstLangs(opts);
    let name = `ebt_${srcLang2}_${dstLang2}_${dstAuthor}`.toLowerCase();
    dbg && console.log(msg, name);
    return name;
  }

  static async create(opts={}) {
    const msg = 'DeepLAdapter.create()';
    const dbg = DBG_CREATE;
    let {
      authFile=path.join(cwd,'local/deepl.auth'),
      srcLang,
      srcLang2,
      dstLang,
      dstLang2,
      dstAuthor='ebt-deepl',
      sourceLang,
      targetLang,
      translateOpts=TRANSLATE_OPTS,
      updateGlossary = false,
      translator,
    } = DeepLAdapter.srcDstLangs(opts);
    dbg && console.log(msg, '[1]opts', opts);
    sourceLang = sourceLang || DeepLAdapter.deeplLang(srcLang);
    targetLang = targetLang || DeepLAdapter.deeplLang(dstLang);
    if (translator == null) {
      let authKey = DeepLAdapter.authKey({authFile});
      dbg && console.log(msg, '[2]new deepl.Translator()');
      let deeplOpts = {
      };
      translator = mockApi
        ? new MockDeepL.Translator(authKey)
        : new deepl.Translator(authKey);
    }

    let glossaryName = DeepLAdapter.glossaryName({
      srcLang, dstLang, dstAuthor});
    let glossaries = await translator.listGlossaries();
    let glossary = glossaries.reduce((a,g)=>{
      return g.name === glossaryName ? g : a;
    }, null)
    if (updateGlossary) {
      let dbg = DBG_GLOSSARY;
      console.warn(msg, "[3]updateGlossary", glossaryName);
      dbg && console.log(msg, "[4]uploadGlossary");
      glossary = await DeepLAdapter.uploadGlossary({
        srcLang, dstLang, dstAuthor, translator, glossaries, 
      });
    } 
    if (glossary) {
      let { glossaryId, name } = glossary;
      dbg && console.warn(msg, '[5]using glossary', name, 
        glossaryId && glossaryId.substring(0,8));
    } else {
      let dbg = DBG_GLOSSARY;
      dbg && console.log(msg, "[6]no glossary");
    }
    translateOpts = translateOpts
      ? JSON.parse(JSON.stringify(translateOpts))
      : TRANSLATE_OPTS;
    glossary && (translateOpts.glossary = glossary);
    let initialized = true;

    let ctorOpts = {
      authFile,
      dstLang,
      dstLang2,
      glossary,
      glossaryName,
      initialized,
      srcLang,
      srcLang2,
      sourceLang,
      targetLang,
      translateOpts,
      translator, 
    }
    dbg && console.log(msg, '[7]ctor', {
      sourceLang, targetLang, glossaryName});
    return new DeepLAdapter(ctorOpts);
  }

  static setMockApi(value) {
    mockApi = value;
  }

  static async uploadGlossary(opts={}) {
    const msg = 'DeepLAdapter.uploadGlossary()';
    const dbg = DBG_GLOSSARY;
    const dbgv = DBG_VERBOSE && dbg;
    let {
      srcLang,
      srcLang2,
      dstLang,
      dstLang2,
      dstAuthor,
      translator,
      glossaries,
    } = DeepLAdapter.srcDstLangs(opts);
    let glossaryName = DeepLAdapter.glossaryName({
      srcLang, dstLang, dstAuthor});
    let glossary;

    if (glossaries == null) {
      glossaries = await translator.listGlossaries();
    }
    for (let i = 0; i < glossaries.length; i++) {
      let g = glossaries[i];
      if (g.name === glossaryName) {
        dbg && console.log(msg, '[1]deleting', g.glossaryId);
        await translator.deleteGlossary(g.glossaryId);
      }
    }

    let fName = `${glossaryName}.kvg`.toLowerCase();
    let glossaryPath = path.join(__dirname, 'glossary', fName);
    if (!fs.statSync(glossaryPath, {throwIfNoEntry:false})) {
      dbg && console.log(msg, `[2]no glossary found: ${glossaryPath}`);
      return null;
    }

    let rawGlossary = fs.statSync(glossaryPath, {throwIfNoEntry:false})
      ? fs.readFileSync(glossaryPath).toString().trim()
      : '';
    let nEntries = 0;
    let entries = rawGlossary.split('\n').reduce((a,kv)=>{
      let [key,value] = kv.split(/\|/);
      if (key && !value) {
        throw new Error(`${msg} [3]no value for key:${key}`);
      } else if (!key && value) {
        throw new Error(`${msg} [4]no key for value:${value}`);
      } else if (!key && !value) {
        // ignore
      } else {
        key = key.trim();
        value = value.trim();
        a[key] = value;
        dbgv && console.log(msg, '[5]', {key,value});
        nEntries++;
      }
      return a;
    },[]);
    if (nEntries) {
      let glossaryEntries = new deepl.GlossaryEntries({entries});
      let sourceLang = DeepLAdapter.deeplLang(srcLang);
      let targetLang = DeepLAdapter.deeplLang(dstLang);
      console.warn(msg, "[6]createGlossary", {
        fName, glossaryName, sourceLang, targetLang, nEntries});
      glossary = await translator.createGlossary(
        glossaryName, sourceLang, targetLang, glossaryEntries);
    }

    return glossary;
  }

  async glossaries() {
    let { translator } = this;
    
    let glossaries = await translator.listGlossaries();
    return glossaries;
  }

  async translate(texts) {
    const msg = "DeeplTranslator.translate()";
    const dbg = DBG_TRANSLATE;
    let { 
      translator, srcLang, dstLang, translateOpts
    } = this;

    let sourceLang = DeepLAdapter.deeplLang(srcLang); 
    let targetLang = DeepLAdapter.deeplLang(dstLang);
    texts = texts.map(t=> t || EMPTY_TEXT);
    var result = await translator
      .translateText(texts, sourceLang, targetLang, translateOpts);
    result = result.map(r=>r.text === EMPTY_TEXT ? '' : r.text);

    return result;
  }
}
