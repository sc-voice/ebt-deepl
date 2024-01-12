import should from "should";
import { logger } from 'log-instance';
logger.logLevel = 'warn';

import { default as DeepLTranslator } from "../src/deepl.mjs";
import { default as SuttaTranslator } from "../src/sutta-translator.mjs";
import { BilaraData } from 'scv-bilara';

const SUTTA_SML = "sn2.16";
const SUTTA_MED = "sn1.20";
const DEEPL = "deepl";
const MODULE = 'sutta-translator';
const DE_TRANSFORM = [{
  reg: /Mönch oder eine Nonne/g,
  rep: "Moench",
}];
const bilaraData = await new BilaraData({name:'ebt-data'}).initialize();

(typeof describe==='function') && describe(MODULE, function() {
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
    should(st.xltDeepL).instanceOf(DeepLTranslator);
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
  it("TESTTESTloadSutta() an3.49/de/sabbamitta", async()=>{
    let sutta_uid = 'an3.49/de/sabbamitta';
    let st = await stDefault();
    let res = await st.loadSutta(sutta_uid, DE_TRANSFORM);
    let {
      segments,
    } = res;
    should(segments['an3.49:2.1']).match(/ein Moench:/);
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
    should(dstSegs['an3.49:1.2']).match(/Quais são os três?/);
    should(dstSegs['an3.49:2.1']).match(/Este é um bhikkhu:/);
    should(dstSegs['an3.49:2.2']).match(/chama um bhikkhu,/);
  });
})
