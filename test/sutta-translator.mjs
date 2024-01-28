import should from "should";
import { logger } from 'log-instance';
logger.logLevel = 'warn';

import { BilaraData } from 'scv-bilara';
import { default as DeepLAdapter } from "../src/deepl-adapter.mjs";
import { default as SuttaTranslator } from "../src/sutta-translator.mjs";
import { 
  DBG_TEST_API,
} from '../src/defines.mjs';

const LDQUOT = '“';
const RDQUOT = '”';
const LSQUOT = '‘';
const RSQUOT = '’';
const SUTTA_SML = "sn2.16";
const SUTTA_MED = "sn1.20";
const DEEPL = "deepl";
const MODULE = 'sutta-translator';
const DE_TRANSFORM = [{
  rex: /Mönch( oder eine Nonne)?/ig,
  rep: "Moench",
}];
const bilaraData = await new BilaraData({name:'ebt-data'}).initialize();

(typeof describe==='function') && describe(MODULE, function() {
  before(()=>{
    DeepLAdapter.setMockApi(!DBG_TEST_API);
  });
  var _stDefault;
  async function stDefault() {
    if (!_stDefault) {
      _stDefault = await SuttaTranslator.create({
        dstLang: 'pt',
        dstAuthor: DEEPL,
        bilaraData,
      });
    }
    return _stDefault;
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
    let srcLang = 'de';
    let dstLang = 'pt';
    let srcAuthor = 'sabbamitta';
    let dstAuthor = DEEPL;
    let st = await stDefault();
    should(st).properties({ srcLang, dstLang, srcAuthor, dstAuthor});
    should(st.xltDeepL).instanceOf(DeepLAdapter);
  });
  it("loadSutta() an3.49", async()=>{
    let sutta_uid = 'an3.49';
    let st = await stDefault();
    let res = await st.loadSutta(sutta_uid);
    let {
      segments,
    } = res;
    should(segments['an3.49:0.3']).match(/Ātappakaraṇīyasutta/);
  });
  it("loadSutta() an3.49/de/sabbamitta", async()=>{
    let sutta_uid = 'an3.49/de/sabbamitta';
    let st = await stDefault();
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
  it("translate() an3.49", async()=>{
    let sutta_uid = 'an3.49';
    let srcLang = 'de';
    let dstLang = 'pt';
    let srcAuthor = 'sabbamitta';
    let dstAuthor = DEEPL;
    let st = await stDefault();
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
    let st = await stDefault();
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
    let st = await stDefault();
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
})
