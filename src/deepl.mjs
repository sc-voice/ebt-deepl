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
      authFile=path.join(cwd,'local/deepl.auth'),
      srcLang='EN',
      dstLang='pt-PT',
    } = opts;

    let authKey = fs.readFileSync(authFile).toString().trim();
    let translator = new deepl.Translator(authKey);
    let glossaryName = `${srcLang}_${dstLang}.kv`.toLowerCase();
    let glossaryPath = path.join(__dirname, 'glossary', glossaryName);
    let glossary = fs.statSync(glossaryPath, {throwIfNoEntry:false})
      ? fs.readFileSync(glossaryPath).toString()
      : '';
    glossary = glossary.replaceAll(/ *: */g, '\t');

    Object.assign(this, {
      srcLang,
      dstLang,
      translator,
      glossaryName,
      glossary,
    });
  }

  async translate(text) {
    let { translator, srcLang, dstLang, } = this;

    const result = await translator.translateText(text, null, dstLang);
    return result;
  }
}
