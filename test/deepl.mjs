import should from "should";
import { default as DeepLTranslator } from "../src/deepl.mjs";
import * as deepl from 'deepl-node';
import {
  DBG_VERBOSE,
} from '../src/defines.mjs';
const dbgv = DBG_VERBOSE;

(typeof describe === 'function') && describe("deepl", function() {
  this.timeout(30*1000);

  it("create() default", async() => {
    let dlt = await DeepLTranslator.create();
    should(dlt).properties({
      srcLang: 'de',
      dstLang: 'pt',
      sourceLang: 'de',
      targetLang: 'pt-PT',
      glossaryName: 'ebt_de_pt',
    });
  });
  it("create() custom", async() => {
    let srcLang = 'pt';
    let dstLang = 'en';
    let dlt = await DeepLTranslator.create({
      srcLang,
      dstLang,
    });
    should(dlt).properties({
      srcLang,
      dstLang,
      sourceLang: 'pt-PT',
      targetLang: 'en',
    });
  });
  it("uploadGlossary() EN", async()=>{
    let authKey = DeepLTranslator.authKey();
    let translator = new deepl.Translator(authKey);
    let srcLang = 'en';
    let dstLang = 'pt';
    let translateOpts = {};
    let glossaryName = DeepLTranslator.glossaryName({srcLang,dstLang});
    let glossary = await DeepLTranslator.uploadGlossary({
      srcLang,
      dstLang,
      translator,
      translateOpts,
    });
    should(glossary).properties({
      name: 'ebt_en_pt',
      ready: true,
      sourceLang: 'en',
      targetLang: 'pt',
    })
  });
  it("translate() EN", async () => {
    let srcLang = 'en';
    let dstLang = 'pt';
    let dlt = await DeepLTranslator.create({srcLang, dstLang});

    // sujato
    let res = await dlt.translate([
      "the dart of craving",
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
  it("uploadGlossary() DE", async()=>{
    let authKey = DeepLTranslator.authKey();
    let translator = new deepl.Translator(authKey);
    let srcLang = 'de';
    let dstLang = 'pt';
    let translateOpts = {};
    let glossaryName = DeepLTranslator.glossaryName({srcLang,dstLang});
    let glossary = await DeepLTranslator.uploadGlossary({
      srcLang,
      dstLang,
      translator,
      translateOpts,
    });
    should(glossary).properties({
      name: 'ebt_de_pt',
      ready: true,
      sourceLang: 'de',
      targetLang: 'pt',
    })
  });
  it("TESTTESTtranslate() DE", async () => {
    let srcLang = 'de';
    let dstLang = 'pt';
    let dlt = await DeepLTranslator.create({srcLang, dstLang});

    // sujato
    let res = await dlt.translate([
      "Der Pfeil des Verlangens",
      "„Moench, du sammelst Almosen, bevor du isst;",
    ]);

    should(res[0].detectedSourceLang).equal('de');
    should(res[0].text).equal('O dardo do anseio');

    // Compare with laera-quaresma:
    // '“Bhikkhu, você esmola comida antes de comer (desfrutar); ';
    should(res[1].detectedSourceLang).equal('de');
    should(res[1].text).equal(
      '"Bhikkhu, você esmola comida antes de comer;');
  });
  it("glossaries()", async() =>{
    let dlt = await DeepLTranslator.create();
    let glossaries = await dlt.glossaries();
    let gpt = glossaries.reduce((a,g,i)=>{
      dbgv && console.log(`test/deepl glossary ${i}`, g);
    }, null);
    should(glossaries).instanceOf(Array);
    should(glossaries.length).above(0);
  });
})
