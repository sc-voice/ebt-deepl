import should from "should";
import { default as DeepLAdapter } from "../src/deepl-adapter.mjs";
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
  it("translate() en-us quotes en/pt", async () => {
    let srcLang = 'en';
    let dstLang = 'pt';
    //DeepLAdapter.setMockApi(false);
    let dlt = await DeepLAdapter.create({srcLang, dstLang});
    const L2 = '“';
    const R2 = '”';
    const L1 = '‘';
    const R1 = '’';

    let res = await dlt.translate([
      `I say, ${L2}You say, ${L1}I said!${R1}?${R2}.`,
    ]);

    let i=0;
    // DeepL fails to translate 3-deep quotes
    should(res[i++]).equal(`Eu digo: "Está a dizer: 'Eu disse!'?".`);
  })
  it("TESTTESTtranslate() en-deepl/pt-deepl quotes", async () => {
    let srcLang = 'en';
    let dstLang = 'pt';
    //DeepLAdapter.setMockApi(false);
    let dlt = await DeepLAdapter.create({srcLang, dstLang});
    const L2 = '“';
    const R2 = '”';
    const L1 = '‘';
    const R1 = '’';

    let res = await dlt.translate([
      `‡†I say, "You say, 'I said!'?".†!‡`,
    ]);

    let i=0;
    // DeepL translates artifical quotes faithfully
    should(res[i++]).equal(`‡†Eu digo, "Você diz, 'Eu disse!'?".†!‡`);
  })
  it("translate() en-us artificial quotes en/pt", async () => {
    let srcLang = 'en';
    let dstLang = 'pt';
    //DeepLAdapter.setMockApi(false);
    let dlt = await DeepLAdapter.create({srcLang, dstLang});
    const L2 = '“';
    const R2 = '”';
    const L1 = '‘';
    const R1 = '’';

    let res = await dlt.translate([
      `I say, “You say, ‘I said!’?”.†!‡`,
    ]);

    let i=0;
    // DeepL fails to translate 3-deep quotes
    should(res[i++]).equal(`Eu digo, "Você diz, 'Eu disse!'?". †!‡`);
  })
  it("translate() en-uk quotes en/pt", async () => {
    let srcLang = 'en';
    let dstLang = 'pt';
    //DeepLAdapter.setMockApi(false);
    let dlt = await DeepLAdapter.create({srcLang, dstLang});
    const L2 = '“';
    const R2 = '”';
    const L1 = '‘';
    const R1 = '’';

    let res = await dlt.translate([
      `I say, ${L1}You say, ${L2}I said!${R2}?${R1}.`,
    ]);

    let i=0;
    // DeepL fails to translate en-uk quotes
    should(res[i++]).equal(`Eu digo: "Está a dizer: "Eu disse!"?`);
  })
  it("translate() most quotes en/pt", async () => {
    let srcLang = 'en';
    let dstLang = 'pt';
    //DeepLAdapter.setMockApi(false);
    let dlt = await DeepLAdapter.create({srcLang, dstLang});
    const L2 = '“';
    const R2 = '”';
    const L1 = '‘';
    const R1 = '’';

    let res = await dlt.translate([
      `${L2}I say, ${L1}You say, ${L2}I said!${R2}?${R1}.${R2}`,
    ]);

    let i=0;
    // DeepL fails to translate 3-deep quotes
    should(res[i++]).equal(`Eu digo: "Você diz: "Eu disse!"?".` );
  });
  it("translate() quotes en/pt", async () => {
    let srcLang = 'en';
    let dstLang = 'pt';
    //DeepLAdapter.setMockApi(false);
    let dlt = await DeepLAdapter.create({srcLang, dstLang});
    const LDQUOT = '“';
    const RDQUOT = '”';
    const LSQUOT = '‘';
    const RSQUOT = '’';

    // sujato
    let res = await dlt.translate([
      `${LDQUOT}I am.${RDQUOT}`,
      `He said, ${LDQUOT}I am.${RDQUOT}`,
      `He said,\n${LDQUOT}I am.${RDQUOT}`,
      `${LDQUOT}These others.${RDQUOT}`,
      `He said, ${LDQUOT}These others.${RDQUOT}`,
      "‘I am.’",
      "He said, ‘I am.’",
      "He said,\n‘I am.’",
      "‘These others.’",
      "He said, ‘These others.’"
    ]);

    let i=0;
    should(res[i++]).equal(`"Estou a fazê-lo."`);
    should(res[i++]).equal(`Ele disse: "Eu sou".`);
    should(res[i++]).equal(`Ele disse,\n"Eu sou".`);
    should(res[i++]).equal(`"Estes outros."`);
    should(res[i++]).equal(`Ele disse: "Estes outros".`);
    should(res[i++]).equal(`Estou a fazê-lo.`);
    should(res[i++]).equal(`Ele disse: "Eu sou".`);
    should(res[i++]).equal(`Ele disse,\n"Eu sou".`);
    should(res[i++]).equal(`"Estes outros".`);
    should(res[i++]).equal(`Ele disse: "Estes outros".`);
  });
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
