import should from "should";
import {
  DeepLAdapter,
  QuoteParser,
} from '../index.mjs';
import { DBG, } from '../src/defines.mjs';
const dbgv = DBG.VERBOSE;
const {
  LQ1, LQ2, LQ3, LQ4,
  RQ1, RQ2, RQ3, RQ4,
  ELLIPSIS, ELL,
} = QuoteParser;

(typeof describe === 'function') && 
  describe("deepl-adapter", function() 
{
  this.timeout(30*1000);

  before(()=>{
    DeepLAdapter.setMockApi(!DBG.TEST_API);
  });

  it("create() default", async() => {
    let dlt = await DeepLAdapter.create();
    should(dlt).properties({
      srcLang: 'en',
      srcLang2: 'en',
      dstLang: 'pt-pt',
      dstLang2: 'pt',
      sourceLang: 'en',
      targetLang: 'pt-pt',
      glossaryName: 'ebt_en_pt_ebt-deepl',
    });
  });
  it("create() custom", async() => {
    let srcLang = 'pt-pt';
    let dstLang = 'de';
    let dlt = await DeepLAdapter.create({
      srcLang,
      dstLang,
    });
    should(dlt).properties({
      srcLang,
      srcLang2: 'pt',
      dstLang,
      dstLang2: 'de',
      sourceLang: 'pt-pt',
      targetLang: 'de',
    });
  });
  it("uploadGlossary() EN", async()=>{
    let dlt = await DeepLAdapter.create();
    let { translator } = dlt;
    let srcLang = 'en';
    let dstLang = 'pt-PT';
    let translateOpts = {};
    let glossaryName = DeepLAdapter.glossaryName({srcLang,dstLang});
    let glossary = await DeepLAdapter.uploadGlossary({
      srcLang,
      dstLang,
      translator,
      translateOpts,
    });
    should(glossaryName).equal('ebt_en_pt_ebt-deepl');
    should(glossary.name).equal('ebt_en_pt_ebt-deepl');
    should(glossary.ready).equal(true);
    should(glossary.sourceLang).equal('en');
    should(glossary.targetLang).equal('pt'); // DeepL 
  });
  it("translate() possessive apostrophe EN", async () => {
    let srcLang = 'en';
    let dstLang = 'fr';
    //DeepLAdapter.setMockApi(false);
    let dlt = await DeepLAdapter.create({srcLang, dstLang});

    // sujato
    let res = await dlt.translate([
      "craving aggregates' origin",
    ]);

    // The straight quote can be used for possessve apostrophe
    should(res[0]).equal(
      'l\'origine des agrégats de l\'envie'
    );
  });
  it("translate() EN=>PT", async () => {
    //DeepLAdapter.setMockApi(false);
    let srcLang = 'en';
    let dstLang = 'pt';
    let dlt = await DeepLAdapter.create({srcLang, dstLang});

    // sujato
    let res = await dlt.translate([
      "the dart of craving",
      "“Bhikkhu, you seek alms before you eat;",
    ]);

    should(res[0]).equal('o dardo do anseio');

    // Compare with laera-quaresma:
    // '“Bhikkhu, você esmola comida antes de comer (desfrutar); ';
    should(res[1]).equal(
      '"Bhikkhu, você procura esmola comida antes de comer;');
  });
  it("TESTTESTtranslate() dark/bright EN>PT", async () => {
    let srcLang = 'en';
    let dstLang = 'pt-PT';
    //DeepLAdapter.setMockApi(false);
    let dlt = await DeepLAdapter.create({srcLang, dstLang});

    // sujato
    let res = await dlt.translate([
      "And what are dark and bright deeds?",
      "On the side of dark and bright",
    ]);

    should.deepEqual(res, [
      'E o que são acções sombrias e luminosas?',
      'Do lado do sombrio e do luminoso',
    ]);
  });
  it("translate() incorrectly EN>PT", async () => {
    let srcLang = 'en';
    let dstLang = 'pt-PT';
    //DeepLAdapter.setMockApi(false);
    let dlt = await DeepLAdapter.create({srcLang, dstLang});

    // sujato
    let res = await dlt.translate([
      "“Bhikkhu, that is incorrect view;",
    ]);

    // Compare with laera-quaresma:
    // '“Bhikkhu, você esmola comida antes de comer (desfrutar); ';
    should(res[0]).equal(
      '"Bhikkhu, essa visão é incorrecta;');
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
      `<w><x>Je dis, <y>Vous dites, <z>Je dis FR!${RQ4}?${RQ3}.${RQ2}${RQ1}`);
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
      `<w><x>Eu digo, <y>Você diz, <z>Eu disse PT!${RQ4}?${RQ3}.${RQ2}${RQ1}`
    );
  })
  it("translate() testcaseRebirthEN FR", async () => {
    let srcLang = 'en';
    let dstLang = 'fr';
    //DeepLAdapter.setMockApi(false);
    let dlt = await DeepLAdapter.create({srcLang, dstLang});
    let qp_en_deepl = new QuoteParser({lang: 'en-deepl'});
    let srcText = qp_en_deepl.testcaseRebirthEN('FR');
    //console.log('srcText', srcText);
    let res = await dlt.translate([srcText]);

    should(res[0]).equal(
    `<x>Je comprends : <y>La renaissance est terminée en FR${RQ3}${RQ2}?${RQ1}`
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
      `<x>Je dis, <y>Vous dites, <z>Je dis FR!${RQ4}?${RQ3}.${RQ2}${RQ1}`);
  })
  it("translate() testcaseQ2EN PT", async () => {
    let srcLang = 'en';
    let dstLang = 'pt';
    let { RQ1,RQ2,RQ3,RQ4 } = QuoteParser;
    //DeepLAdapter.setMockApi(false);
    let dlt = await DeepLAdapter.create({srcLang, dstLang});
    let srcText = QuoteParser.testcaseQ2EN('PT');
    //console.log('srcText', srcText);
    let res = await dlt.translate([srcText]);

    // Closing XML element is passed through
    should(res[0]).equal(
      `<x>Eu digo, <y>Você diz, <z>Eu disse PT!${RQ4}?${RQ3}.${RQ2}${RQ1}`);
  })
  it("translate() testcaseThinking_EN", async () => {
    let srcLang = 'en';
    let dstLang = 'es';
    let { LQ1, RQ1 } = QuoteParser;
    //DeepLAdapter.setMockApi(false);
    let dlt = await DeepLAdapter.create({srcLang, dstLang});
    let srcText = QuoteParser.testcaseThinking_EN('SPAN');
    //console.log('srcText', srcText);
    let res = await dlt.translate([srcText]);

    // Closing XML element is passed through
    should(res[0]).equal(
      `Pensando, ${LQ1}He hecho cosas SPAN por medio del cuerpo, `+
      `la palabra y la mente${RQ1}, se mortifican.`);
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
    let dstLang = 'pt-PT';
    let dstAuthor = 'ebt-deepl';
    let translateOpts = {};
    let glossaryName = DeepLAdapter.glossaryName({
      srcLang, dstLang, dstAuthor});
    let glossary = await DeepLAdapter.uploadGlossary({
      srcLang,
      dstLang,
      translator,
      translateOpts,
    });
    should(glossary.name).equal('ebt_de_pt_ebt-deepl');
    should(glossary.ready).equal(true);
    should(glossary.sourceLang).equal('de');
    should(glossary.targetLang).equal('pt'); // DeepL
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
    DBG.TEST_API && should(glossaries.length).above(0);
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
  it("translate() testcaseEllipsisEN PT", async () => {
    let srcLang = 'en';
    let dstLang = 'pt-PT';
    //DeepLAdapter.setMockApi(false);
    let dlt = await DeepLAdapter.create({srcLang, dstLang});
    let prefix = "They understand: ";
    let lQuote = LQ1;
    let rQuote = RQ1;
    let ellipsis = ELL;
    let tcOpts = { prefix, lQuote, rQuote, ellipsis };
    let srcText = QuoteParser.testcaseEllipsisEN('PT', tcOpts);
    //console.log('srcText:', srcText);
    let res = await dlt.translate([srcText]);

    should(res[0]).equal([
      `Eles compreendem: <w>Isto é PT</w><ell/>`,
      `<w>Isto é sofrimento</w><ell/>`,
      `<w>Isto é a origem</w>.`,
    ].join(''));
  })
  it("translate() testcaseEllipsisEN ES", async () => {
    const msg = "test.DeepLAdapter@297";
    const dbg = 0;
    let srcLang = 'en';
    let dstLang = 'es';
    //DeepLAdapter.setMockApi(false);
    let prefix = "They understand: ";
    let lQuote = LQ1;
    let rQuote = RQ1;
    let ellipsis = ELL;
    let tcOpts = { prefix, lQuote, rQuote, ellipsis };
    let dlt = await DeepLAdapter.create({srcLang, dstLang});
    let srcText = QuoteParser.testcaseEllipsisEN('ES',tcOpts);
    dbg && console.log(msg, 'srcText:', srcText);
    let res = await dlt.translate([srcText]);

    should(res[0]).equal([
      `Ellos comprenden: `, `<w>Esto es ES</w>`, 
      ellipsis, `<w>Esto es sufrimiento</w>`, 
      ellipsis, `<w>Este es el origen</w>`, 
      `.`,
    ].join(''));
  })
})
