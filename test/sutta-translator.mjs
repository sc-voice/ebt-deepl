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
  async function st_en_pt() {
    return await SuttaTranslator.create({
      //srcLang: 'en',
      //srcAuthor: 'sujato',
      //dstLang: 'pt-PT',
      //dstAuthor: DEEPL,
      //bilaraData,
    });
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
  it("loadSutta() an3.49/de/sabbamitta", async()=>{
    let sutta_uid = 'an3.49/de/sabbamitta';
    let st = await st_de_pt();
    let txt = '"an3.49:2.1": "Das ist ein Mönch, der eifrig ist, '
    let res = await st.loadSutta(sutta_uid, {
      srcTransform: DE_TRANSFORM,
      bilaraData,
    });
    let {
      segments,
    } = res;
    should(segments['an3.49:2.1']).match(/ein Moench,/);
  });
  it("titleCase()", async()=>{
    let paliWords = await SuttaTranslator.paliWords();

    // Pali
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
  it("translate() an3.49", async()=>{
    let sutta_uid = 'an3.49';
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
    should(dstSegs['an3.49:1.1']).match(/bhikkhus,/);
    should(dstSegs['an3.49:1.2']).match(/Quais são os três?/);
    should(dstSegs['an3.49:2.1']).match(/Este é um bhikkhu /);
    should(dstSegs['an3.49:2.2']).match(/chama um bhikkhu /);
  });
  it("translate() an5.44", async()=>{
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
      `<x>I say, <y>You say, <z>I said UKPT!</z>?</y>.</x></w>`
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
      `<x>I say, <y>You say, <z>I said UKFR!</z>?</y>.</x></w>`
    );
  });
  it("preTranslate() testcaseFeelingsEN French", async()=>{
    const msg = 'test.SuttaTranslator.preTranslate()';
    const dbg = 0;
    let srcLang = 'en';
    let dstLang = 'fr';
    let st = await SuttaTranslator.create({srcLang, dstLang});
    let rawText = st.qpSrc.testcaseFeelingsEN('French');
    let { srcTransform } = st;
    let text = SuttaTranslator.transformText(rawText, srcTransform);
    let srcTexts = [text];
    dbg && console.log(msg, srcTexts);
    let preXlt = st.preTranslate(srcTexts);
    should(preXlt[0]).equal(
      `what's the escape from that French feeling?</x>`
    );
  });
  it("transformText() testcaseThinkinEN ES", async()=>{
    const msg = 'testcaseTHinkingEN ES';
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
  it("translate() testcaseRebirthEN FR", async()=>{
    const msg = 'test.SuttaTranslator.translate()';
    //DeepLAdapter.setMockApi(false);
    let qp_en = new QuoteParser({lang:'en'});
    let sp = QuoteParser.THNSP;
    let srcTexts = [ qp_en.testcaseRebirthEN('FR') ];
    //console.log(msg, srcTexts);
    let st = await st_en_fr();
    //DeepLAdapter.setMockApi(false);
    let dstTexts = await st.translateTexts(srcTexts);
    should(dstTexts[0]).match(
      /‹ Je comprends : “La renaissance est terminée en FR” ›\?\u2009?»/
    );
  });
  it("translate() testcaseFeelingsEN FR", async()=>{
    const msg = "test.SuttaTranslator@451";
    console.log(msg, "TODO");
    return; 
    //DeepLAdapter.setMockApi(false);
    let qp_en = new QuoteParser({lang:'en'});
    let srcTexts = [ qp_en.testcaseFeelingsEN('French') ];
    //console.log(msg, srcTexts);
    let st = await st_en_fr();
    let dstTexts = await st.translateTexts(srcTexts);
    should(dstTexts[0]).match(
      'comment échapper à ce sentiment français ? '
    );
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
      'There Sāriputta addressed the mendicants',
      'There the Blessed One is now staying',
      'There is, brahmin.'
    ];
    dbg && console.log(msg, srcTexts);
    let st = await st_en_pt();
    let dstTexts = await st.translateTexts(srcTexts);
    dbg && console.log(msg, dstTexts);
    let i = 0;
    should(dstTexts[i++]).equal(
      'Aí, Sāriputta dirigiu-se aos mendicantes ');
    should(dstTexts[i++]).equal(
      'Lá o Abençoado está agora a ficar ');
    should(dstTexts[i++]).equal(
      'Há, brâmane. ');
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
      `Ellos comprenden: «Esto es ES» … `,
      `«Esto es sufrimiento» … `,
      `«Este es el origen». `,
    ].join(''));
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
})
