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
  LSQUOT, RSQUOT,
  LDQUOT, RDQUOT,
  LDGUIL, RDGUIL,
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
  it("translate() testcaseQuotes PT", async () => {
    const msg = "test.DeepLAadapter@87";
    const dbg = 0;
    //DeepLAdapter.setMockApi(false);
    let srcLang = 'en';
    let dstLang = 'pt';
    let RQ1 = QuoteParser.RQ1;
    let dlt = await DeepLAdapter.create({srcLang, dstLang});
    let lQuote = QuoteParser.LQ1;
    let rQuote = QuoteParser.RQ1;
    let lang = 'mind/PT';
    let srcTexts = [
      QuoteParser.testcaseQuotesEN({lang, lQuote}),
      QuoteParser.testcaseQuotesEN({lang, rQuote}),
      QuoteParser.testcaseQuotesEN({lang, lQuote, rQuote}),
    ];

    dbg && console.log(msg, '[1]srcTexts', srcTexts);
    let res = await dlt.translate(srcTexts);

    should.deepEqual(res, [
      `${LQ1}Ouça e aplique bem a sua mente/PT, eu falarei.`,
      `Ouça e aplique bem a sua mente/PT, eu falarei.${RQ1}`,
      `${LQ1}Ouça e aplique bem a sua mente/PT, eu falarei.${RQ1}`,
    ]);
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
  it("translate() dark/bright EN>PT", async () => {
    const msg = 'test.DeepLTranslator@132';
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
      'E o que são actos sombrios e luminosos?',
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
    const msg = 'test.DeepLTranslator@167';
    let srcLang = 'en';
    let dstLang = 'fr';
    //DeepLAdapter.setMockApi(false);
    let dlt = await DeepLAdapter.create({srcLang, dstLang});
    let srcText = QuoteParser.testcaseDepthEN('FR');
    //console.log('srcText', srcText);
    let res = await dlt.translate([srcText]);

    should(res[0]).equal(
      `${LQ1}${LQ2}Je dis, ${LQ3}Vous dites, ${LQ4}Je dis FR!${RQ4}?${RQ3}.${RQ2}${RQ1}.`);
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
      `${LQ1}${LQ2}Eu digo, ${LQ3}Você diz, ${LQ4}Eu disse PT!${RQ4}?${RQ3}.${RQ2}${RQ1}`
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
    `${LQ2} Je comprends : ${LQ3}La renaissance est terminée en FR${RQ3}${RQ2}?${RQ1}.`
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
      `${LQ2}Je dis, ${LQ3}Vous dites, ${LQ4}Je dis FR!${RQ4}?${RQ3}.${RQ2}${RQ1}.`);
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
      `${LQ2}Eu digo, ${LQ3}Você diz, ${LQ4}Eu disse PT!${RQ4}?${RQ3}.${RQ2}${RQ1}`);
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
      `Eles compreendem: ${LQ1}Isto é PT${RQ1}<ell/>`,
      `${LQ1}Isto é sofrimento${RQ1}<ell/>`,
      `${LQ1}Isto é a origem${RQ1}.`,
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
      `Comprenden: `, `${LQ1}Esto es ES${RQ1}`, 
      ellipsis, `${LQ1}Esto es sufrimiento${RQ1}`, 
      ellipsis, `${LQ1}Este es el origen${RQ1}`, 
      `.`,
    ].join(''));
  })
  it("translate() trailing xml", async () => {
    const msg = "test.DeepLAdapter@371";
    let dbg = DBG.DEEPL_XLT;
    dbg && console.log(msg);
    let srcLang = 'en';
    let dstLang = 'pt-pt';
    //DeepLAdapter.setMockApi(false);
    let dlt = await DeepLAdapter.create({srcLang, dstLang});

    let res = await dlt.translate([
      `These are two people in the world who are worthy of a religious-PT donation.${RQ1}`
    ]);

    should.deepEqual(res, [
      `Estas são duas pessoas no mundo que são dignas de um donativo religioso-PT.${RQ1}`
    ]);
  });
  it("translate() trailing xml messenger", async () => {
    const msg = "test.DeepLAdapter@388";
    let dbg = DBG.DEEPL_XLT;
    dbg && console.log(msg);
    //DeepLAdapter.setMockApi(false);
    let srcLang = 'en';
    let dstLang = 'pt-pt';
    let dlt = await DeepLAdapter.create({srcLang, dstLang});
    let gods = 'DEVA1s';
    let lQuote = LQ2;
    let rQuote = RQ2;
    let lang = 'messenger/PT';

    let res = await dlt.translate([
      QuoteParser.testcaseMisterEN({ lQuote, rQuote, gods, lang }),
    ]);

    should.deepEqual(res, [
      `${lQuote}Senhor, não viu o primeiro mensageiro/PT dos ${gods} que apareceu entre os seres humanos?${rQuote}`,
    ]);
  });
  it("translate() trailing xml elderly", async () => {
    const msg = "test.DeepLAdapter@388";
    let dbg = DBG.DEEPL_XLT;
    dbg && console.log(msg);
    //DeepLAdapter.setMockApi(false);
    let srcLang = 'en';
    let dstLang = 'pt-pt';
    let dlt = await DeepLAdapter.create({srcLang, dstLang});
    let lQuote = LQ2;
    let rQuote = RQ2;
    let lang = ' PT';

    let res = await dlt.translate([
      QuoteParser.testcaseElderlyEN({ lQuote, rQuote, lang }),
    ]);

    should.deepEqual(res, [
      lQuote+
      `Senhor PT, não viu entre os seres humanos `+
      `uma mulher ou um homem idoso - com oitenta, `+
      `noventa ou cem anos - dobrado, torto, apoiado `+
      `num bordão, a tremer ao andar, doente, fora de moda, `+
      `com os dentes partidos, o cabelo grisalho e escasso `+
      `ou calvo, a pele enrugada e os membros manchados?`+
      rQuote,
    ]);
  });
  it("translate() trailing xml sick", async () => {
    const msg = "test.DeepLAdapter@388";
    //DBG.DEEPL_XLT = true;
    let dbg = DBG.DEEPL_XLT;
    dbg && console.log(msg);
    //DeepLAdapter.setMockApi(false);
    let srcLang = 'en';
    let dstLang = 'pt-pt';
    let dlt = await DeepLAdapter.create({srcLang, dstLang});
    let lang = 'PT sickness';

    let res = await dlt.translate([
      QuoteParser.testcaseSickEN({ lang }),
    ]);

    should.deepEqual(res, [
      LQ1+
      'Eu também estou sujeito a ficar doente. '+
      'Não estou isento da doença de PT. É melhor fazer o '+
      'bem através do corpo, da fala e da mente'+
      RQ1+
      '?'+
      RQ2
    ]);
  });
})
