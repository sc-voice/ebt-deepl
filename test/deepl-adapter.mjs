import should from "should";
import { default as DeepLAdapter } from "../src/deepl-adapter.mjs";
import { default as QuoteParser } from "../src/quote-parser.mjs";
import * as deepl from 'deepl-node';
import {
  DBG_VERBOSE, DBG_TEST_API
} from '../src/defines.mjs';
const dbgv = DBG_VERBOSE;

(typeof describe === 'function') && describe("deepl", function() {
  this.timeout(30*1000);

  before(()=>{
    DeepLAdapter.setMockApi(!DBG_TEST_API);
  });

  it("create() default", async() => {
    let dlt = await DeepLAdapter.create();
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
    let dlt = await DeepLAdapter.create({
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
    let dlt = await DeepLAdapter.create();
    let { translator } = dlt;
    let srcLang = 'en';
    let dstLang = 'pt';
    let translateOpts = {};
    let glossaryName = DeepLAdapter.glossaryName({srcLang,dstLang});
    let glossary = await DeepLAdapter.uploadGlossary({
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
    let dlt = await DeepLAdapter.create({srcLang, dstLang});

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
  it("translate() testcaseDepthEN FR", async () => {
    let srcLang = 'en';
    let dstLang = 'fr';
    //DeepLAdapter.setMockApi(false);
    let dlt = await DeepLAdapter.create({srcLang, dstLang});
    let srcText = QuoteParser.testcaseDepthEN('FR');
    //console.log('srcText', srcText);
    let res = await dlt.translate([srcText]);

    should(res[0]).equal(
      `<w><x>Je dis, <y>Vous dites, <z>J'ai dit FR !</z>?.</y></x></w>`);
  })
  it("translate() testcaseDepthEN PT", async () => {
    let srcLang = 'en';
    let dstLang = 'pt';
    //DeepLAdapter.setMockApi(false);
    let dlt = await DeepLAdapter.create({srcLang, dstLang});
    let srcText = QuoteParser.testcaseDepthEN('PT');
    //console.log('srcText:', srcText);
    let res = await dlt.translate([srcText]);

    should(res[0]).equal(
      `<w><x>Eu digo, <y>Você diz, <z>Eu disse PT!</z>?</y></x></w>`
    );
  })
  it("translate() testcaseRebirthEN FR", async () => {
    let srcLang = 'en';
    let dstLang = 'fr';
    //DeepLAdapter.setMockApi(false);
    let dlt = await DeepLAdapter.create({srcLang, dstLang});
    let qp_en_deepl = new QuoteParser({lang: 'en-deepl'});
    let srcText = qp_en_deepl.testcaseRebirthEN('FR');
    console.log('srcText', srcText);
    let res = await dlt.translate([srcText]);

    should(res[0]).equal(
    '<x>Je comprends : <y>La renaissance est terminée en FR</y></x>?</w>'
    )
  })
  it("translate() testcaseQ2EN FR", async () => {
    let srcLang = 'en';
    let dstLang = 'fr';
    //DeepLAdapter.setMockApi(false);
    let dlt = await DeepLAdapter.create({srcLang, dstLang});
    let srcText = QuoteParser.testcaseQ2EN('FR');
    //console.log('srcText', srcText);
    let res = await dlt.translate([srcText]);

    should(res[0]).equal(
      `<x>Je dis, <y>Vous dites, <z>J'ai dit FR !</z>?.</y></x></w>`);
  })
  it("translate() testcaseQ2EN PT", async () => {
    let srcLang = 'en';
    let dstLang = 'pt';
    //DeepLAdapter.setMockApi(false);
    let dlt = await DeepLAdapter.create({srcLang, dstLang});
    let srcText = QuoteParser.testcaseQ2EN('PT');
    //console.log('srcText', srcText);
    let res = await dlt.translate([srcText]);

    // Closing XML element is passed through
    should(res[0]).equal(
      '<x>Eu digo, <y>Você diz, <z>Eu disse PT!</z>?</y></x></w>');
  })
  it("translate() en-uk quotes en/pt", async () => {
    let srcLang = 'en';
    let dstLang = 'pt';
    //DeepLAdapter.setMockApi(false);
    let dlt = await DeepLAdapter.create({srcLang, dstLang});

    let res = await dlt.translate([
      `I say, ‘You say, “I said UK!”?’.`,
    ]);

    // DeepL fails to translate en-uk quotes
    should(res[0]).equal(
      `Eu digo: "Está a dizer: "Eu disse Reino Unido!"?`);
  })
  it("uploadGlossary() DE", async()=>{
    let dlt = await DeepLAdapter.create();
    let { translator } = dlt;
    let srcLang = 'de';
    let dstLang = 'pt';
    let translateOpts = {};
    let glossaryName = DeepLAdapter.glossaryName({srcLang,dstLang});
    let glossary = await DeepLAdapter.uploadGlossary({
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
    let dlt = await DeepLAdapter.create({srcLang, dstLang});

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
  it("glossaries()", async() =>{
    let dlt = await DeepLAdapter.create();
    let glossaries = await dlt.glossaries();
    let gpt = glossaries.reduce((a,g,i)=>{
      dbgv && console.log(`test/deepl glossary ${i}`, g);
    }, null);
    should(glossaries).instanceOf(Array);
    DBG_TEST_API && should(glossaries.length).above(0);
  });
})
