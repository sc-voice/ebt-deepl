import should from "should";
import { logger } from 'log-instance';
logger.logLevel = 'warn';

import { BilaraData } from 'scv-bilara';
import { default as DeepLAdapter } from "../src/deepl-adapter.mjs";
import { default as SuttaTranslator } from "../src/sutta-translator.mjs";
import { default as QuoteParser } from "../src/quote-parser.mjs";
import { 
  DBG_TEST_API,
} from '../src/defines.mjs';

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
} = QuoteParser;

(typeof describe==='function') && describe(MODULE, function() {
  before(()=>{
    DeepLAdapter.setMockApi(!DBG_TEST_API);
  });
  var _st_en_pt;
  var _st_de_pt;
  async function st_en_pt() {
    if (!_st_en_pt) {
      _st_en_pt = await SuttaTranslator.create({
        srcLang: 'en',
        srcAuthor: 'sujato',
        dstLang: 'pt',
        dstAuthor: DEEPL,
        bilaraData,
      });
    }
    return _st_en_pt;
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
  it("TESTESTcreate() default", async() => {
    let srcLang = 'en';
    let dstLang = 'pt';
    let srcAuthor = 'sujato';
    let dstAuthor = DEEPL;
    let st = await st_en_pt();
    should(st).properties({ srcLang, dstLang, srcAuthor, dstAuthor});
    should(st.xltDeepL).instanceOf(DeepLAdapter);
  });
  it("TESTTESTcreate() en", async() => {
    let srcLang = 'en';
    let srcAuthor = 'sujato';
    let dstLang = 'pt';
    let dstAuthor = 'ebt-deepl';
    let st = await SuttaTranslator.create({
      srcLang, srcAuthor, dstLang, dstAuthor});
    should(st).properties({ srcLang, dstLang, });
    should(st.xltDeepL).instanceOf(DeepLAdapter);
    should(st.qpSrc1).instanceOf(QuoteParser);
    should(st.qpSrc2).instanceOf(QuoteParser);
    should(st.qpSrc1?.lang).equal('en-us');
    should(st.qpSrc2?.lang).equal('en-uk');
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
    should(segments['an3.49:0.3']).match(/Ātappakaraṇīyasutta/);
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
  it("TESTTESTtranslate() an3.49", async()=>{
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
  it("TESTTESTtranslate() an5.44", async()=>{
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
    should.deepEqual(SuttaTranslator.curlyQuoteSegments(segs), segsExpected);
  });
  it("TESTTESTpreTranslate() quoted en/pr", async()=>{
    let srcTexts = [
      `“‘I say, “You say, ‘I said!’?”.’!”`, // not in quotation
      `‘“I say, ‘You say, “I said!”?’.”!’`, // in quotation
      'Hello there',
    ]; 
    let srcLang = 'en';
    let dstLang = 'pt';
    let st = await SuttaTranslator.create({srcLang, dstLang});
    should(st).properties({ srcLang, dstLang, });
    let preXlt = st.preTranslate(srcTexts);
    should(preXlt[0]).equal(
      `"${LQ2}I say, ${LQ3}You say, ${LQ4}I said!${RQ4}?${RQ3}.${RQ2}!"`
    );
    should(preXlt[1]).equal(
      `"${LQ2}I say, ${LQ3}You say, ${LQ4}I said!${RQ4}?${RQ3}.${RQ2}!"`
    );
    should(preXlt[2]).equal('Hello there');
  });
  it("TESTTESTpostTranslate() quoted en/pt-pt", async()=>{
    let xltTexts = [
`"${LQ2}Eu digo, ${LQ3}Você diz, ${LQ4}Eu disse!${RQ4}?${RQ3}.${RQ2}!"`,
    ]; 
    let srcLang = 'en';
    let dstLang = 'pt';
    let st = await SuttaTranslator.create({srcLang, dstLang});
    should(st).properties({ srcLang, dstLang, });
    let postXlt = st.postTranslate(xltTexts);
    should(postXlt[0])
      .equal(`«“Eu digo, ‘Você diz, “Eu disse!”?’.”!»`)
    //        "'Eu digo, ‡Você diz, †Eu disse!†?‡.'!"
  });
  it("TESTTESTpostTranslate() quoted en/pt-br", async()=>{
    let xltTexts = [
`"${LQ2}Eu digo, ${LQ3}Você diz, ${LQ4}Eu disse!${RQ4}?${RQ3}.${RQ2}!"`,
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
    should(postXlt[0])
      .equal(`“‘Eu digo, “Você diz, ‘Eu disse!’?”.’!”`)
    //        "'Eu digo, ‡Você diz, †Eu disse!†?‡.'!"
  });
})
