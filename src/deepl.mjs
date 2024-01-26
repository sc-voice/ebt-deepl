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

var mockApi = DBG_MOCK_API;

export default class DeepLTranslator {
  constructor(opts={}) {
    let {
      authFile,
      dstLang, // bilara-data lang
      srcLang, // bilara-data lang
      glossary,
      glossaryName,
      initialized,
      sourceLang, // deepl lang
      targetLang,// deepl lang
      translateOpts,
      translator,
    } = opts;

    let emsg = 'use DeepLTranslator.create()';
    let check = 1;
    if (null == authFile) throw new Error(`${emsg} ${check}`);
    check++;
    if (null == dstLang) throw new Error(`${emsg} ${check}`);
    check++;
    if (null == glossaryName) throw new Error(`${emsg} ${check}`);
    check++;
    if (null == initialized) throw new Error(`${emsg} ${check}`);
    check++;
    if (null == sourceLang) throw new Error(`${emsg} ${check}`);
    check++;
    if (null == targetLang) throw new Error(`${emsg} ${check}`);
    check++;
    if (null == srcLang) throw new Error(`${emsg} ${check}`);
    check++;
    if (null == translateOpts) throw new Error(`${emsg} ${check}`);
    check++;
    if (null == translator) throw new Error(`${emsg} ${check}`);
    check++;

    Object.assign(this, {
      authFile,
      dstLang,
      glossary,
      glossaryName,
      initialized,
      srcLang,
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

  static deeplLang(lang) {
    switch (lang) {
      case 'pt': return 'pt-PT';
      default: return lang;
    }
  }

  static glossaryName(opts={}) {
    let {
      srcLang,
      dstLang,
    } = opts;
    return `ebt_${srcLang}_${dstLang}`.toLowerCase();
  }

  static async create(opts={}) {
    const msg = 'DeepLTranslator.create()';
    const dbg = DBG_CREATE;
    let {
      authFile=path.join(cwd,'local/deepl.auth'),
      srcLang='en',
      dstLang='pt',
      sourceLang,
      targetLang,
      formality='more',
      translateOpts,
      updateGlossary = false,
      translator,
    } = opts;
    sourceLang = sourceLang || DeepLTranslator.deeplLang(srcLang);
    targetLang = targetLang || DeepLTranslator.deeplLang(dstLang);
    if (translator == null) {
      let authKey = DeepLTranslator.authKey({authFile});
      dbg && console.log(msg, '[1]new deepl.Translator()');
      translator = mockApi
        ? new MockDeepL.Translator(authKey)
        : new deepl.Translator(authKey);
    }

    let glossaryName = DeepLTranslator.glossaryName({srcLang, dstLang});
    let glossaries = await translator.listGlossaries();
    let glossary = glossaries.reduce((a,g)=>{
      return g.name === glossaryName ? g : a;
    }, null)
    if (updateGlossary) {
      if (glossary) {
        let { glossaryId, name } = glossary;
        dbg && console.log(msg, '[4]using glossary', name, 
          glossaryId && glossaryId.substring(0,8));
      } else {
        dbg && console.log(msg, "[5]uploadGlossary");
        glossary = await DeepLTranslator.uploadGlossary({
          srcLang, dstLang, translator, glossaries, });
      }
    } else {
      dbg && console.log(msg, "[6]no glossary");
    }
    translateOpts = translateOpts
      ? JSON.parse(JSON.stringify(translateOpts))
      : {formality};
    glossary && (translateOpts.glossary = glossary);
    let initialized = true;

    let ctorOpts = {
      authFile,
      dstLang,
      glossary,
      glossaryName,
      initialized,
      srcLang,
      sourceLang,
      targetLang,
      translateOpts,
      translator, 
    }
    dbg && console.log(msg, '[7]ctor', {
      sourceLang, targetLang, glossaryName});
    return new DeepLTranslator(ctorOpts);
  }

  static setMockApi(value) {
    mockApi = value;
  }

  static async uploadGlossary(opts={}) {
    const msg = 'DeepLTranslator.uploadGlossary()';
    const dbg = DBG_GLOSSARY;
    const dbgv = DBG_VERBOSE && dbg;
    let {
      srcLang,
      dstLang,
      translator,
      glossaries,
    } = opts;
    let glossaryName = DeepLTranslator.glossaryName({srcLang, dstLang});
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
      let sourceLang = DeepLTranslator.deeplLang(srcLang);
      let targetLang = DeepLTranslator.deeplLang(dstLang);
      dbg && console.log(msg, "[6]create", {
        glossaryName, sourceLang, targetLang, nEntries});
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

    let sourceLang = DeepLTranslator.deeplLang(srcLang); 
    let targetLang = DeepLTranslator.deeplLang(dstLang);
    texts = texts.map(t=> t || EMPTY_TEXT);
    var result = await translator
      .translateText(texts, sourceLang, targetLang, translateOpts);
    result = result.map(r=>r.text === EMPTY_TEXT ? '' : r.text);

    return result;
  }
}
