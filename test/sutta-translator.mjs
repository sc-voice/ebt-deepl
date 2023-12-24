import should from "should";
import { logger } from "log-instance/index.mjs";
import { default as DeepLTranslator } from "../src/deepl.mjs";
import { default as SuttaTranslator } from "../src/sutta-translator.mjs";

const ID_PT = 'ebt_en_pt-pt';

(typeof describe === 'function') && 
  describe("sutta-translator", function() 
{
  this.timeout(60*1000);
  it("TESTTESTdefault ctor()", ()=>{
    let eCaught;
    try {
      new SuttaTranslator();
    } catch (e) {
      eCaught = e;
    }
    should(eCaught?.message).match(/use SuttaTranslator.create()/);
  });
  it("TESTTESTcreate() default", async() => {
    let srcLang = 'de';
    let dstLang = 'pt-PT';
    let srcAuthor = 'sabbamitta';
    let dstAuthor = 'edited-ml';
    let st = await SuttaTranslator.create({
      srcLang, dstLang, srcAuthor, dstAuthor,
    });
    should(st).properties({ srcLang, dstLang, srcAuthor, dstAuthor});
    should(st.translator).instanceOf(DeepLTranslator);
  });
})
