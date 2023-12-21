import fs from "fs";
import * as deepl from 'deepl-node';

export default class DeepLTranslator {
  constructor(opts={}) {
    let {
      authFile='./local/deepl.auth',
      srcLang='EN',
      dstLang='pt-PT',
    } = opts;

    let authKey = fs.readFileSync(authFile).toString().trim();
    let translator = new deepl.Translator(authKey);

    Object.assign(this, {
      srcLang,
      dstLang,
      translator,
    });
  }

  async translate(text) {
    let { translator, srcLang, dstLang, } = this;

    const result = await translator.translateText(text, null, dstLang);
    return result;
  }
}
