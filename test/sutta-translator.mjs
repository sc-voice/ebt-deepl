import should from "should";
import { logger } from "log-instance/index.mjs";
import { default as DeepLTranslator } from "../src/deepl.mjs";
import { default as SuttaTranslator } from "../src/sutta-translator.mjs";

const SUTTA_SML = "sn2.16";
const SUTTA_MED = "sn1.20";
const DEEPL = "deepl";
(typeof describe === 'function') && 
  describe("sutta-translator", function() 
{
  var _stDefault;
  async function stDefault() {
    if (!_stDefault) {
      _stDefault = await SuttaTranslator.create({
        dstLang: 'pt',
        dstAuthor: DEEPL,
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
  it("TESTTESTtranslate() an3.49", async()=>{
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
  });
})
