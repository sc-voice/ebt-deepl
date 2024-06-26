import should from "should";

import { logger } from 'log-instance';
logger.level = 'warn';
import { BilaraData } from 'scv-bilara';
import { 
  DeepLAdapter,
  QuoteParser,
  SuttaTranslator,
} from "../index.mjs";
import { DBG, } from "../src/defines.mjs";

const LDQUOT = '“';
const RDQUOT = '”';
const LSQUOT = '‘';
const RSQUOT = '’';
const SUTTA_SML = "sn2.16";
const SUTTA_MED = "sn1.20";
const DEEPL = "ebt-deepl";
const MODULE = 'sutta-translator';
const DE_TRANSFORM = [{
  rex: /Mönch( oder eine Nonne)?/ig,
  rep: "Moench",
}];
const bilaraData = await new BilaraData({name:'ebt-data'}).initialize();
const {
  LQ1, LQ2, LQ3, LQ4,
  RQ1, RQ2, RQ3, RQ4,
  LDGUIL, RDGUIL, ELLIPSIS, ELL,
} = QuoteParser;

(typeof describe==='function') && describe(MODULE, function() {
  before(()=>{
    DeepLAdapter.setMockApi(!DBG.TEST_API);
  });
  var _st_de_pt;
  async function st_en_pt(opts={}) {
    return await SuttaTranslator.create(opts);
  }
  async function st_en_es() {
    return await SuttaTranslator.create({
      srcLang: 'en',
      srcAuthor: 'sujato',
      dstLang: 'es',
      dstAuthor: 'ebt-deepl',
      bilaraData,
    });
  }
  async function st_en_fr() {
    return await SuttaTranslator.create({
      srcLang: 'en',
      srcAuthor: 'sujato',
      dstLang: 'fr',
      dstAuthor: 'noeismet',
      bilaraData,
    });
  }
  async function st_de_pt() {
    if (!_st_de_pt) {
      _st_de_pt = await SuttaTranslator.create({
        srcLang: 'de',
        srcAuthor: 'sabbamitta',
        dstLang: 'pt',
        dstAuthor: DEEPL,
        bilaraData,
      });
    }
    return _st_de_pt;
  }
  
  this.timeout(60*1000); 
  it("default ctor()", ()=>{
    let eCaught;
    try {
      new SuttaTranslator();
    } catch (e) {
      eCaught = e;
    }
    should(eCaught?.message).match(/use SuttaTranslator.create()/);
  });
  it("create() default", async() => {
    let srcLang = 'en';
    let dstLang = 'pt-PT';
    let srcAuthor = 'sujato';
    let dstAuthor = DEEPL;
    let st = await st_en_pt();
    should(st.srcLang).equal('en');
    should(st.srcLang2).equal('en');
    should(st.dstLang).equal('pt-pt');
    should(st.dstLang2).equal('pt');
    should(st.xltDeepL).instanceOf(DeepLAdapter);
  });
  it("create() en", async() => {
    let srcLang = 'en';
    let srcAuthor = 'sujato';
    let dstLang = 'pt';
    let dstAuthor = 'ebt-deepl';
    let st = await SuttaTranslator.create({
      srcLang, srcAuthor, dstLang, dstAuthor});
    should(st).properties({ srcLang, dstLang, });
    should(st.xltDeepL).instanceOf(DeepLAdapter);
    should(st.qpSrc).instanceOf(QuoteParser);
    should(st.qpSrc?.lang).equal('en-us');
    should(st.qpPost?.lang).equal('pt-deepl');
    should(st.qpDst?.lang).equal('pt-pt');
  });
  it("loadSutta() an3.49", async()=>{
    let sutta_uid = 'an3.49';
    let st = await st_en_pt();
    let res = await st.loadSutta(sutta_uid);
    let {
      segments,
    } = res;
    should(segments['an3.49:0.3']).match(/Ātappakaraṇīyasutta/i);
  });
  it("loadSutta() an2.1-10", async()=>{
    let sutta_uid = 'an2.1-10/en/sujato';
    let st = await st_en_es();
    let res = await st.loadSutta(sutta_uid);
    let { segments, } = res;
    let seg = segments[`an2.2:1.0`];
    should(segments[`an2.2:1.0`]).match(/2. endeavor/);
  });
  it("titleCase()", async()=>{
    let paliWords = await SuttaTranslator.paliWords();

    // Pali
    should(SuttaTranslator.titleCase('É por isso que durmo descansado'))
      .equal('É por isso que durmo descansado');
    should(SuttaTranslator.titleCase('De cabeça para baixo'))
      .equal('De cabeça para baixo');
    should(SuttaTranslator.titleCase('About Pacetana'))
      .equal('About Pacetana');

    // Multiple words
    should(SuttaTranslator.titleCase('the red fox'))
      .equal('The red fox');

    // Numbers
    should(SuttaTranslator.titleCase('2. ESFUERZO'))
      .equal('2. Esfuerzo');
    should(SuttaTranslator.titleCase('2. esfuerzo'))
      .equal('2. Esfuerzo');
    should(SuttaTranslator.titleCase('2. About Pacetana'))
      .equal('2. About Pacetana');
  });
  it("translate() titles an3.94", async()=>{
    let sutta_uid = 'an3.94';
    let srcLang = 'en';
    let dstLang = 'pt';
    let srcAuthor = 'sujato';
    let dstAuthor = DEEPL;
    //DeepLAdapter.setMockApi(false);
    let st = await st_en_pt();
    let res = await st.translate(sutta_uid);
    let { 
      srcRef, srcPath, srcSegs, dstRef, dstPath, dstSegs 
    } = res;
    should(srcRef).properties({ 
      sutta_uid, lang: 'en', author: 'sujato' });
    should(dstRef).properties({ 
      sutta_uid, lang: 'pt', author: DEEPL });
    should(dstSegs['an3.94:0.3']).equal(
      'Primavera ',
    );
  });
  it("translate() an5.44", async()=>{
    const msg = 'test.SuttaTranslator@209';
    //DeepLAdapter.setMockApi(false);
    let sutta_uid = 'an5.44';
    let srcLang = 'de';
    let dstLang = 'pt';
    let srcAuthor = 'sabbamitta';
    let dstAuthor = DEEPL;
    let st = await st_de_pt();
    let res = await st.translate(sutta_uid);
    let { 
      srcRef, srcPath, srcSegs, dstRef, dstPath, dstSegs 
    } = res;
    should(srcRef).properties({ 
      sutta_uid, lang: 'de', author: 'sabbamitta' });
    should(dstRef).properties({ 
      sutta_uid, lang: 'pt', author: DEEPL });

    should(dstSegs[`${sutta_uid}:2.5`]).match(/por compaixão./);
  });
  it("curlyQuoteText()", async ()=>{
    let st = await st_en_pt();
    let xltText1 = `"they speak of 'substantial reality'`;
    let scText1 = `“they speak of ‘substantial reality’`;
    let xltText2 = `here," he said.`;
    let scText2 = `here,” he said.`;
    let xltText3 = `She said, 'why?`;
    let scText3 = `She said, ‘why?`;

    let res1 = SuttaTranslator.curlyQuoteText(xltText1);
    should.deepEqual(res1, {
      scText: scText1,
      state: { single: 0, double: 1 }, // open double quote
    });

    let res2 = SuttaTranslator.curlyQuoteText(xltText2, res1.state);
    should.deepEqual(res2, {
      scText: scText2,
      state: { single: 0, double: 0 }, // all quotes closed
    });

    let res3 = SuttaTranslator.curlyQuoteText(xltText3, res2.state);
    should.deepEqual(res3, {
      scText: scText3,
      state: { single: 1, double: 0 }, // open single quotes
    });
  });
  it("curlyQuoteSegments()", async ()=>{
    let segs= {
      's1:1.0': `"a'b`,
      's1:1.1': `c d`,
      's1:1.2': `e' d"`,
    }
    let segsExpected = {
      's1:1.0': `${LDQUOT}a${LSQUOT}b`,
      's1:1.1': `c d`,
      's1:1.2': `e${RSQUOT} d${RDQUOT}`,
    }
    should.deepEqual(SuttaTranslator.curlyQuoteSegments(segs), 
      segsExpected);
  });
  it("transformText() ellipsis en/es", async()=>{
    const msg = 'test.transformText() ellipsis';
    const dbg = 0;
    let srcLang = 'en';
    let dstLang = 'es';
    let tcOpts = {
      lQuote: LDQUOT,
      rQuote: RDQUOT,
      ellipsis: ELLIPSIS,
    }
    let st = await SuttaTranslator.create({srcLang, dstLang});
    let srcText = QuoteParser.testcaseEllipsisEN("ES",tcOpts); 
    let preXlt = SuttaTranslator.transformText(srcText, st.srcTransform);
    dbg && console.log(msg, srcText, preXlt[0]);
    should(preXlt).equal([
      'They understand: ',
      `${LDQUOT}This is ES${RDQUOT}${ELL}`,
      `${LDQUOT}This is suffering${RDQUOT}${ELL}`,
      `${LDQUOT}This is the origin${RDQUOT}.`,
    ].join(''));
  });
  it("preTranslate() en-us quoted en/pr", async()=>{
    let srcTexts = [
      `“‘I say, “You say, ‘I said!’?”.’!”`, // en-us
      'Hello there',
    ]; 
    let srcLang = 'en';
    let dstLang = 'pt';
    let st = await SuttaTranslator.create({srcLang, dstLang});
    should(st).properties({ srcLang, dstLang, });
    let preXlt = st.preTranslate(srcTexts);
    should(preXlt[0]).equal(
      `${LQ1}${LQ2}I say, ${LQ3}You say, `+
        `${LQ4}I said!${RQ4}?${RQ3}.${RQ2}!${RQ1}`
    );
    should(preXlt[1]).equal('Hello there');
  });
  it("preTranslate() en-uk quoted en/pt", async()=>{
    let text = QuoteParser.testcaseQ2EN('UKPT');
    let srcTexts = [text];
    //console.log(text);
    let srcLang = 'en';
    let dstLang = 'pt';
    let st = await SuttaTranslator.create({srcLang, dstLang});
    should(st).properties({ srcLang, dstLang, });
    let preXlt = st.preTranslate(srcTexts);
    should(preXlt[0]).equal(
      `${LQ2}I say, ${LQ3}You say, ${LQ4}I said UKPT!${RQ4}?${RQ3}.${RQ2}${RQ1}`
    );
  });
  it("preTranslate() en-uk quoted en/fr", async()=>{
    const msg = "test.SuttaTranslator@303";
    //DeepLAdapter.setMockApi(false);
    let text = QuoteParser.testcaseQ2EN('UKFR');
    let srcTexts = [text];
    //console.log(text);
    let srcLang = 'en';
    let dstLang = 'pt';
    let st = await SuttaTranslator.create({srcLang, dstLang});
    should(st).properties({ srcLang, dstLang, });
    let preXlt = st.preTranslate(srcTexts);
    should(preXlt[0]).equal(
      `${LQ2}I say, ${LQ3}You say, ${LQ4}I said UKFR!${RQ4}?${RQ3}.${RQ2}${RQ1}`
    );
  });
  it("transformText() testcaseThinkinEN ES", async()=>{
    const msg = 'test.SuttaTranslator@351';
    const dbg = 0;
    let srcLang = 'en';
    let dstLang = 'es';
    //DeepLAdapter.setMockApi(false);
    let st = await SuttaTranslator.create({srcLang, dstLang});
    let srcTexts = [ QuoteParser.testcaseThinking_EN('SPAN') ];
    let { srcTransform } = st;
    let dstTexts = await st.translateTexts(srcTexts);
    should(dstTexts[0]).equal(
      'Pensando, «He hecho cosas SPAN por medio del cuerpo, '+
      'la palabra y la mente», se mortifican. ')
  });
  it("preTranslate() ellipsis en/es", async()=>{
    const msg = 'test.preTranslate() ellipsis';
    const dbg = 0;
    let srcLang = 'en';
    let dstLang = 'es';
    let st = await SuttaTranslator.create({srcLang, dstLang});
    let tcOpts = {
      lQuote: LDQUOT,
      rQuote: RDQUOT,
      ellipsis: ELL,
    }
    let srcTexts = [ 
      QuoteParser.testcaseEllipsisEN("ES", tcOpts) 
    ];
    let preXlt = st.preTranslate(srcTexts);
    dbg && console.log(msg, srcTexts[0], preXlt[0]);
    should(preXlt[0]).equal([
      'They understand: ',
      `${LQ1}This is ES${RQ1}${ELL}`,
      `${LQ1}This is suffering${RQ1}${ELL}`,
      `${LQ1}This is the origin${RQ1}.`,
    ].join(''));
  });
  it("postTranslate() ellipsis en/es", async()=>{
    const msg = 'test.postTranslate() ellipsis';
    const dbg = 0;
    //DeepLAdapter.setMockApi(false);
    let srcLang = 'en';
    let dstLang = 'es';
    let st = await SuttaTranslator.create({srcLang, dstLang});
    let tcOpts = {
      lQuote: LQ1,
      rQuote: RQ1,
      ellipsis: ELL,
    }
    let srcTexts = [ 
      QuoteParser.testcaseEllipsisEN("ES", tcOpts) 
    ];
    let preXlt = st.postTranslate(srcTexts);
    dbg && console.log(msg, srcTexts[0], preXlt[0]);
    should(preXlt[0]).equal([
      'They understand: ',
      `${LDGUIL}This is ES${RDGUIL} ${ELLIPSIS} `,
      `${LDGUIL}This is suffering${RDGUIL} ${ELLIPSIS} `,
      `${LDGUIL}This is the origin${RDGUIL}. `,
    ].join(''));
  });
  it("postTranslate() quoted en/pt-pt", async()=>{
    let xltTexts = [ `Aí, o Buda dirigiu-se aos bhikkhus,`, ]; 
    let srcLang = 'en';
    let dstLang = 'pt-pt';
    let st = await SuttaTranslator.create({srcLang, dstLang});
    should(st).properties({ srcLang, dstLang, });
    let postXlt = st.postTranslate(xltTexts);
    should(postXlt[0]).equal(`Aí, o Buda dirigiu-se aos monges, `);
  });
  it("postTranslate() quoted en/pt-pt", async()=>{
    let xltTexts = [
      `${LQ1}${LQ2}Eu digo, ${LQ3}Você diz, `+
        `${LQ4}Eu disse!${RQ4}?${RQ3}.${RQ2}!${RQ1}`,
    ]; 
    let srcLang = 'en';
    let dstLang = 'pt';
    let st = await SuttaTranslator.create({srcLang, dstLang});
    should(st).properties({ srcLang, dstLang, });
    let postXlt = st.postTranslate(xltTexts);
    should(postXlt[0])
      .equal(`«“Eu digo, ‘Você diz, “Eu disse!”?’.”!» `
    );
  });
  it("postTranslate() quoted en/pt-br", async()=>{
    let xltTexts = [
      `${LQ1}${LQ2}Eu digo, ${LQ3}Você diz, `+
        `${LQ4}Eu disse!${RQ4}?${RQ3}.${RQ2}!${RQ1}`,
    ]; 
    let srcLang = 'en';
    let srcAuthor = 'sujato';
    let dstLang = 'pt';
    let dstAuthor = 'laera-quaresma';
    let st = await SuttaTranslator.create({
      srcLang, srcAuthor, dstLang, dstAuthor 
    });
    should(st).properties({ srcLang, dstLang, });
    should(st.qpDst?.lang).equal('pt-br');
    let postXlt = st.postTranslate(xltTexts);
    should(postXlt[0]).equal(
      `“‘Eu digo, “Você diz, ‘Eu disse!’?”.’!” `
    );
  });
  it("translate() Durmo PT", async()=>{
    const msg = 'test.SuttaTranslator@478';
    //DeepLAdapter.setMockApi(false);
    let qp_en = new QuoteParser({lang:'en'});
    let srcTexts = [ 
      '<wit/>', //'Why is that?',
      'That is why I sleep at ease. ',
    ];
    //console.log(msg, srcTexts);
    let st = await st_en_pt();
    let dstTexts = await st.translateTexts(srcTexts);
    should.deepEqual(dstTexts, [
      'Porque é que é assim? ', // vs. excessively brief "Porque?"
      `É por isso que durmo tranquilo. `,
    ]);
  });
  it("translate() testcasePleasuresEN FR", async()=>{
    const msg = 'test.SuttaTranslator.translate()';
    //DeepLAdapter.setMockApi(false);
    let qp_en = new QuoteParser({lang:'en'});
    let srcTexts = [ qp_en.testcasePleasuresEN('French') ];
    //console.log(msg, srcTexts);
    let st = await st_en_fr();
    let dstTexts = await st.translateTexts(srcTexts);
    should(dstTexts[0]).match(
     'comprendre la gratification, l’inconvénient et la fuite des plaisirs français '
    );
  });
  it("translateTexts() testcaseApostropheEN FR", async()=>{
    const msg = 'test.SuttaTranslator.translate()';
    const dbg = 0;
    //DeepLAdapter.setMockApi(false);
    let qp_en = new QuoteParser({lang:'en'});
    let qp_fr = new QuoteParser({lang:'fr'});
    let srcTexts = [ qp_en.testcaseApostropheEN('French') ];
    dbg && console.log(msg, srcTexts);
    let st = await st_en_fr();
    let dstTexts = await st.translateTexts(srcTexts);
    should(dstTexts[0]).match(
      qp_fr.testcaseApostropheFR('français ')
    );
    dbg && console.log(msg, dstTexts);
  });
  it("translateTexts() There are EN", async()=>{
    const msg = 'test.SuttaTranslator.translate()';
    const dbg = 0;
    //DeepLAdapter.setMockApi(false);
    let srcTexts = [ 
      'There Sāriputta addressed the bhikkhus',
      'There the Blessed One is now staying',
      'There is, brahmin.'
    ];
    dbg && console.log(msg, srcTexts);
    let st = await st_en_pt();
    let dstTexts = await st.translateTexts(srcTexts);
    dbg && console.log(msg, dstTexts);
    let i = 0;
    should(dstTexts[i++]).equal(
      'Aí Sāriputta dirigiu-se aos monges ');
    should(dstTexts[i++]).equal(
      'Lá o Abençoado está agora a ficar ');
    should(dstTexts[i++]).equal(
      'Existe, brâmane. ');
  });
  it("translateTexts() the skillful EN", async()=>{
    const msg = 'test.SuttaTranslator.translateTexts()';
    const dbg = 0;
    //DeepLAdapter.setMockApi(false);
    let srcTexts = [ 
      'are these things skillful or unskillful?',
      'succeed in the system of skillful teaching.',
      'so the skillful person ',
      'They are entirely a heap of the skillful. "',
      'He gives up the unskillful and develops the skillful.',
      'Whatever qualities are skillful, part of the skillful, all are rooted.',
      'One who desires merit, grounded in the skillful, ',
    ];
    dbg && console.log(msg, srcTexts);
    let st = await st_en_pt();
    let dstTexts = await st.translateTexts(srcTexts);
    dbg && console.log(msg, dstTexts);
    let i = 0;
    should(dstTexts[i++]).equal(
      'estas coisas são hábeis ou inábeis? ');
    should(dstTexts[i++]).equal(
      'tenha sucesso no sistema de ensino hábil. ');
    should(dstTexts[i++]).equal(
      'por isso, a pessoa hábil ');
    should(dstTexts[i++]).equal(
      'São inteiramente um amontoado de hábeis. " ');
    should(dstTexts[i++]).equal(
      'Abandona o inábil e desenvolve o hábil. ');
    should(dstTexts[i++]).equal( 
      'Quaisquer que sejam as qualidades hábeis, parte do hábil, todas estão enraizadas. ');
    should(dstTexts[i++]).equal( 
      'Aquele que deseja o mérito, baseado no hábil, ');
  });
  it("isTitle() titles ES", async()=>{
    should(SuttaTranslator.isTitle('an2.1-10:0.1')).equal(true);
    should(SuttaTranslator.isTitle('an2.1-10:1.1')).equal(false);
    should(SuttaTranslator.isTitle('an2.1-10:1.1.1')).equal(false);
    should(SuttaTranslator.isTitle('an2.1-10:1.0')).equal(true);
    should(SuttaTranslator.isTitle('an2.1-10:1.0.1')).equal(true);
    should(SuttaTranslator.isTitle('an2.1-10:10-20.0')).equal(true);
    should(SuttaTranslator.isTitle('an2.1-10:10-20.1')).equal(false);
  });
  it("translateTexts() quotes ES", async()=>{
    const msg = 'test.SuttaTranslator.translateTexts()';
    const dbg = 0;
    //DeepLAdapter.setMockApi(false);
    let srcTexts = [ 
      QuoteParser.testcaseThinking_EN("SPAN"),
    ];
    dbg && console.log(msg, srcTexts);
    let st = await st_en_es();
    let dstTexts = await st.translateTexts(srcTexts);
    should(dstTexts[0]).equal(
     `Pensando, «He hecho cosas SPAN por medio del cuerpo, la palabra y la mente», se mortifican. `,
    );
    dbg && console.log(msg, dstTexts);
  });
  it("translateTexts() titles ES", async()=>{
    const msg = 'test.SuttaTranslator.translateTexts()';
    const dbg = 0;
    //DeepLAdapter.setMockApi(false);
    let srcTexts = [ 
      '2. padhānasutta', 
      '2. Padhānasutta', 
      '2. endeavor',
      '2. Endeavor',
    ];
    dbg && console.log(msg, srcTexts);
    let st = await st_en_es();
    let dstTexts = await st.translateTexts(srcTexts);
    should(dstTexts[0]).equal(
      '2. padhānasutta ', 
      '2. Padhānasutta ', 
      '2. esforzarse ',
      '2. Endeavor ', // WHY!?
    );
    dbg && console.log(msg, dstTexts);
  });
  it("translateTexts() ellipsis ES", async()=>{
    const msg = 'test.SuttaTranslator@585';
    const dbg = 0;
    //DeepLAdapter.setMockApi(false);
    let tcOpts = {
      lQuote: LDQUOT,
      rQuote: RDQUOT,
      ellipsis: ELL,
    }
    let srcTexts = [ 
      QuoteParser.testcaseEllipsisEN('ES',tcOpts)
    ];
    dbg && console.log(msg, srcTexts);
    let st = await st_en_es();
    let dstTexts = await st.translateTexts(srcTexts);
    dbg && console.log(msg, dstTexts);
    should(dstTexts[0]).equal([
      `Comprenden: «Esto es ES» … `,
      `«Esto es sufrimiento» … `,
      `«Este es el origen». `,
    ].join(''));
  });
  it("translateTexts() I will speak PT", async()=>{
    const msg = 'test.SuttaTranslator@642';
    const dbg = 0;
    //DeepLAdapter.setMockApi(false);
    let srcTexts = [ 
      QuoteParser.LQ1,
      QuoteParser.testcaseQuotesEN({
        lang: 'mind/PT',
        rQuote:QuoteParser.RQ1,
      }),
    ];
    dbg && console.log(msg, srcTexts);
    let st = await st_en_pt();
    let dstTexts = await st.translateTexts(srcTexts);
    should.deepEqual(dstTexts, [
      `${QuoteParser.LDGUIL} `,
      `Ouça e aplique bem a sua mente/PT, eu falarei.» `,
    ]);
    dbg && console.log(msg, dstTexts);
  });
  it("translateTexts() testcaseDonationEN PT", async()=>{
    const msg = 'test.SuttaTranslator@658';
    //DeepLAdapter.setMockApi(false);
    let srcTexts = [ 
      QuoteParser.LQ1,
      QuoteParser.testcaseDonationEN({
        lang: 'religious-PT',
        rQuote:QuoteParser.RQ1,
      }),
    ];
    let st = await st_en_pt();
    let dstTexts = await st.translateTexts(srcTexts);
    should.deepEqual(dstTexts, [
      `${QuoteParser.LDGUIL} `,
      `Estas são duas pessoas no mundo que são dignas de um donativo religioso-PT, e é aí que deve dar um presente.» `
    ]);
  });
  it("translateTexts() visão incorrecta EN", async()=>{
    const msg = 'test.SuttaTranslator.translateTexts()';
    const dbg = 0;
    //DeepLAdapter.setMockApi(false);
    let srcTexts = [ 
      '“Bhikkhus, I do not see a single thing that is so '+
        'very blameworthy as wrong view.',
    ];
    dbg && console.log(msg, srcTexts);
    let st = await st_en_pt();
    let dstTexts = await st.translateTexts(srcTexts);
    should(dstTexts[0]).equal(
      '«Monges, eu não vejo uma única coisa que seja '+
        'tão culpável como uma visão incorreta. '
    );
    dbg && console.log(msg, dstTexts);
  });
  it("postTranslate() monges, incorrecto PT", async()=>{
    const msg = 'test.SuttaTranslator.postTranslate()';
    const dbg = 0;
    let xltTexts = [
      'É impossível, bhikkhus, é incorrecto.',
    ]; 
    let srcLang = 'en';
    let dstLang = 'pt-pt';
    let st = await SuttaTranslator.create({srcLang, dstLang});
    dbg && console.log(st.dstTransform);
    should(st).properties({ srcLang, dstLang, });
    let postXlt = st.postTranslate(xltTexts);
    should(postXlt[0]).equal(
      'É impossível, monges, é incorreto. ',
    );
  });
  it("translateTexts() testcaseMister  PT", async()=>{
    const msg = 'test.SuttaTranslator@789';
    const dbg = 0;
    //DeepLAdapter.setMockApi(false);
    let srcTexts = [ 
      QuoteParser.testcaseMisterEN({
        lang: 'messenger/PT',
        lQuote:QuoteParser.LQ3,
        rQuote:QuoteParser.RQ3,
      }),
    ];
    dbg && console.log(msg, srcTexts);
    let st = await st_en_pt();
    let dstTexts = await st.translateTexts(srcTexts);
    should.deepEqual(dstTexts, [
      `‘Senhor, você não viu o primeiro mensageiro/PT dos devas que apareceu entre os seres humanos?’ `,
    ]);
    dbg && console.log(msg, dstTexts);
  });
  it("translateTexts() testcaseSickEN  PT", async()=>{
    const msg = "test.SuttaTranslator@690";
    //DBG.SUTTA_XLT = true;
    //DBG.MOCK_XLT = true;
    const dbg = DBG.SUTTA_XLT;
    dbg && console.log(msg);
    //DeepLAdapter.setMockApi(false);
    let opts={
      lQuote1: LDQUOT,
      rQuote1: RDQUOT,
      rQuote2: RSQUOT,
      lang: 'PT sickness',
      apos: RSQUOT,
    }
    let srcTexts = [ QuoteParser.testcaseSickEN(opts), ];
    let st = await st_en_pt();
    let [ LQ1, LQ2, LQ3, LQ4 ] = st.qpDst.openQuotes;
    let [ RQ1, RQ2, RQ3, RQ4 ] = st.qpDst.closeQuotes;
    console.log(msg, '***** BEGIN SYNC ERROR TEST');
    let dstTexts = await st.translateTexts(srcTexts);
    console.log(msg, '***** END SYNC ERROR TEST');
    should.deepEqual(dstTexts, [
      `${LQ3}Eu também estou sujeito a ficar doente. Não `+
        `estou isento da doença de PT. É melhor fazer o `+
        `bem através do corpo, da fala e da mente${RQ3}?${RQ2} `
    ]);
  });
  it("preTranslate() testcaseSickEN  PT", async()=>{
    const msg = "test.SuttaTranslator@709";
    //DBG.SUTTA_XLT = true;
    //DBG.QUOTE = true;
    const dbg = DBG.SUTTA_XLT;
    dbg && console.log(msg);
    let opts={
      lQuote1: LDQUOT, // level 3 open
      rQuote1: RDQUOT, // level 3 close
      rQuote2: RSQUOT, // level 2 close
      lang: 'PT sickness',
      apos: RSQUOT,
    }
    let srcTexts = [ 
      `${LDQUOT}${LSQUOT}`, // preceding quotes
      QuoteParser.testcaseSickEN(opts), // quote startLevel 2 (vs. 0)
    ];

    // simulate a quote sync error by omitting preceding quotes
    const SYNC_ERROR = true;
    SYNC_ERROR && srcTexts.shift();

    let st = await st_en_pt();
    console.log(msg, '***** BEGIN SYNC ERROR TEST');
    let preXlt = st.preTranslate(srcTexts);
    console.log(msg, '***** END SYNC ERROR TEST');
    should.deepEqual(preXlt, [
      `${LQ3}I, too, am liable to become sick. I\'m not exempt `+
        `from PT sickness. I\'d better do good by way of `+
        `body, speech, and mind${RQ3}?${RQ2}`,
    ]);
  });
  it("translateTexts() testcaseDonationEN PT", async()=>{
    const msg = 'test.SuttaTranslator@658';
    //DeepLAdapter.setMockApi(false);
    let srcTexts = [ 
      QuoteParser.LDQUOT,
      'when warned by the gods’ messengers: ',
    ];
    let st = await st_en_pt();
    let dstTexts = await st.translateTexts(srcTexts);
    should.deepEqual(dstTexts, [
      `${QuoteParser.LDGUIL} `,
      `quando avisados pelos mensageiros dos devas: `,
    ]);
  });
})
