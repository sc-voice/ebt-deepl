import fs from "fs";
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cwd = process.cwd();

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
    if (null == glossary) throw new Error(`${emsg} ${check}`);
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
      translateOpts,
      translator,
    });
  }

  static create(opts={}) {
    let {
      authFile=path.join(cwd,'local/deepl.auth'),
      srcLang='EN',
      dstLang='pt-PT',
      translateOpts={formality:'more'},
    } = opts;

    let authKey = fs.readFileSync(authFile).toString().trim();
    let translator = new deepl.Translator(authKey);
    let glossaryName = `${srcLang}_${dstLang}.kv`.toLowerCase();
    let glossaryPath = path.join(__dirname, 'glossary', glossaryName);
    let glossary = fs.statSync(glossaryPath, {throwIfNoEntry:false})
      ? fs.readFileSync(glossaryPath).toString()
      : '';
    glossary = glossary.replaceAll(/ *: */g, '\t');
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
      translator, 
    });
  }

  assertInitialized() {
    if (!this.initialized) {
      throw new Error("initialize() is required");
    }
    return this;
  }

  async initialize() {
    this.initialized = true;
    return this;
  }

  async glossaries() {
    let { translator } = this.assertInitialized();
    
    let glossaries = await translator.listGlossaries();
    return glossaries;
  }

  async translate(text) {
    let { 
      translator, srcLang, dstLang, translateOpts
    } = this.assertInitialized();

    const result = await translator
      .translateText(text, srcLang, dstLang, translateOpts);
    return result;
  }
}
