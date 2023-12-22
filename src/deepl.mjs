import fs from "fs";
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cwd = process.cwd();

import {
  DBG_GLOSSARY,
} from './defines.mjs'
import * as deepl from 'deepl-node';

export default class DeepLTranslator {
  constructor(opts={}) {
    let {
      authFile,
      dstLang,
      glossary,
      glossaryName,
      initialized,
      srcLang,
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

  static glossaryName(opts={}) {
    let {
      srcLang,
      dstLang,
    } = opts;
    return `ebt_${srcLang}_${dstLang}`.toLowerCase();
  }

  static async create(opts={}) {
    const msg = 'DeepLTranslator.create()';
    const dbg = 0;
    let {
      authFile=path.join(cwd,'local/deepl.auth'),
      srcLang='en',
      dstLang='pt-PT',
      formality='more',
      translateOpts,
    } = opts;

    let authKey = DeepLTranslator.authKey({authFile});
    let translator = new deepl.Translator(authKey);
    let glossaryName = DeepLTranslator.glossaryName({srcLang, dstLang});
    let glossaries = await translator.listGlossaries();
    let glossary = glossaries.reduce((a,g)=>{
      return g.name === glossaryName ? g : a;
    }, [])
    if (glossary) {
      dbg && console.log(msg, '[4]using glossary', glossary.name, 
        glossary.glossaryId.substring(0,8));
    } else {
      dbg && console.log(msg, "[5]creating glossary");
      glossary = await DeepLTranslator.uploadGlossary({
        srgLang, dstLang, translator, 
        glossaries,
      });
    }
    translateOpts = translateOpts
      ? JSON.parse(JSON.stringify(translateOpts))
      : {formality};
    translateOpts.glossary = glossary;
    let initialized = true;

    return new DeepLTranslator({
      authFile,
      dstLang,
      glossary,
      glossaryName,
      initialized,
      srcLang,
      translateOpts,
      translator, 
    });
  }

  static async uploadGlossary(opts={}) {
    const msg = 'DeepLTranslator.uploadGlossary()';
    const dbg = DBG_GLOSSARY;
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
      for (let i = 0; i < glossaries.length; i++) {
        let g = glossaries[i];
        if (g.name === glossaryName) {
          dbg && console.log(msg, '[1]deleting', g.glossaryId);
          await translator.deleteGlossary(g.glossaryId);
        }
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
        dbg && console.log(msg, {key,value});
        nEntries++;
      }
      return a;
    },[]);
    if (nEntries) {
      let glossaryEntries = new deepl.GlossaryEntries({entries});
      dbg && console.log(msg, "[6]create", {glossaryName, nEntries});
      glossary = await translator.createGlossary(
        glossaryName, srcLang, dstLang, glossaryEntries
      );
    }

    return glossary;
  }

  async glossaries() {
    let { translator } = this;
    
    let glossaries = await translator.listGlossaries();
    return glossaries;
  }

  async translate(text) {
    let { 
      translator, srcLang, dstLang, translateOpts
    } = this;

    const result = await translator
      .translateText(text, srcLang, dstLang, translateOpts);
    return result;
  }
}
