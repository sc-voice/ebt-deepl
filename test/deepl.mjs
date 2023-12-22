import should from "should";
import { execSync } from "child_process";
import { logger } from "log-instance/index.mjs";
import { default as DeepLTranslator } from "../src/deepl.mjs";
import * as deepl from 'deepl-node';

const ID_PT = 'ebt_en_pt-pt';

(typeof describe === 'function') && describe("deepl", function() {
  this.timeout(10*1000);
  var logLevel = false;

  it("create() default", async() => {
    let dlt = await DeepLTranslator.create();
    should(dlt).properties({
      srcLang: 'en',
      dstLang: 'pt-PT',
      glossaryName: ID_PT,
    });
  });
  it("() custom", async() => {
    let srcLang = 'pt-PT';
    let dstLang = 'en';
    let dlt = await DeepLTranslator.create({
      srcLang,
      dstLang,
    });
    should(dlt).properties({
      srcLang,
      dstLang,
    });
  });
  it("uploadGlossary()", async()=>{
    let authKey = DeepLTranslator.authKey();
    let translator = new deepl.Translator(authKey);
    let srcLang = 'en';
    let dstLang = 'pt-PT';
    let translateOpts = {};
    let glossaryName = DeepLTranslator.glossaryName({srcLang,dstLang});
    let glossary = await DeepLTranslator.uploadGlossary({
      srcLang,
      dstLang,
      translator,
      translator,
      translateOpts,
    });
    should(glossary).properties({
      name: 'ebt_en_pt-pt',
      ready: true,
      sourceLang: 'en',
      targetLang: 'pt',
    })
  });
  it("TESTTESTtranslate()", async () => {
    let srcLang = 'en';
    let dstLang = 'pt-PT';
    let dlt = await DeepLTranslator.create();

    // sujato
    let res = await dlt.translate([
      "the dart of desire",
      "“Mendicant, you seek alms before you eat;",
    ]);

    should(res[0].text).equal('o dardo do anseio');
    should(res[0].detectedSourceLang).equal('en');

    // Compare with laera-quaresma:
    // '“Bhikkhu, você esmola comida antes de comer (desfrutar); ';
    should(res[1].text).equal(
      '"Bhikkhu, você esmola comida antes de comer;');
    should(res[1].detectedSourceLang).equal('en');
  });
  it("glossaries()", async() =>{
    let dlt = await DeepLTranslator.create();
    let glossaries = await dlt.glossaries();
    let gpt = glossaries.reduce((a,g)=>{
    }, null);
    should(glossaries).instanceOf(Array);
    should(glossaries.length).above(0);
  });
})
