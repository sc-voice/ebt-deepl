import should from "should";
import { default as DeepLTranslator } from "../src/deepl.mjs";
import * as deepl from 'deepl-node';
import {
  DBG_VERBOSE, DBG_TEST_API
} from '../src/defines.mjs';
const dbgv = DBG_VERBOSE;

(typeof describe === 'function') && describe("deepl", function() {
  this.timeout(30*1000);

  before(()=>{
    DeepLTranslator.setMockApi(!DBG_TEST_API);
  });

  it("create() default", async() => {
    let dlt = await DeepLTranslator.create();
    should(dlt).properties({
      srcLang: 'en',
      dstLang: 'pt',
      sourceLang: 'en',
      targetLang: 'pt-PT',
      glossaryName: 'ebt_en_pt',
    });
  });
  it("create() custom", async() => {
    let srcLang = 'pt';
    let dstLang = 'de';
    let dlt = await DeepLTranslator.create({
      srcLang,
      dstLang,
    });
    should(dlt).properties({
      srcLang,
      dstLang,
      sourceLang: 'pt-PT',
      targetLang: 'de',
    });
  });
  it("uploadGlossary() EN", async()=>{
    let dlt = await DeepLTranslator.create();
    let { translator } = dlt;
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

    should(res[0]).equal('o dardo do anseio');

    // Compare with laera-quaresma:
    // '“Bhikkhu, você esmola comida antes de comer (desfrutar); ';
    should(res[1]).equal(
      '"Bhikkhu, você esmola comida antes de comer;');
  });
  it("uploadGlossary() DE", async()=>{
    let dlt = await DeepLTranslator.create();
    let { translator } = dlt;
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
  it("translate() DE", async () => {
    let srcLang = 'de';
    let dstLang = 'pt';
    let dlt = await DeepLTranslator.create({srcLang, dstLang});

    // sujato
    let res = await dlt.translate([
      "Der Pfeil des Verlangens",
      "„Moench, du sammelst Almosen, bevor du isst;",
    ]);

    should(res[0]).equal('O dardo do anseio');

    // Compare with laera-quaresma:
    // '“Bhikkhu, você esmola comida antes de comer (desfrutar); ';
    should(res[1]).equal(
      '"Bhikkhu, você esmola comida antes de comer;');
  });
  it("TESTTESTglossaries()", async() =>{
    let dlt = await DeepLTranslator.create();
    let glossaries = await dlt.glossaries();
    let gpt = glossaries.reduce((a,g,i)=>{
      dbgv && console.log(`test/deepl glossary ${i}`, g);
    }, null);
    should(glossaries).instanceOf(Array);
    DBG_TEST_API && should(glossaries.length).above(0);
  });
})
