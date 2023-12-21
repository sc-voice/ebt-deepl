import should from "should";
import { execSync } from "child_process";
import { logger } from "log-instance/index.mjs";
import { default as DeepLTranslator } from "../src/deepl.mjs";

(typeof describe === 'function') && describe("deepl", function() {
  this.timeout(10*1000);
  var logLevel = false;

  it("TESTTESTdefault ctor", () => {
    let dlt = new DeepLTranslator();
    should(dlt).properties({
      srcLang: 'EN',
      dstLang: 'pt-PT',
      glossaryName: 'en_pt-pt.kv',
      glossary: 'desire\tanseio\n',
    });
  });
  it("TESTTESTcustom ctor", () => {
    let srcLang = 'pt-PT';
    let dstLang = 'en';
    let dlt = new DeepLTranslator({
      srcLang,
      dstLang,
    });
    should(dlt).properties({
      srcLang,
      dstLang,
    });
  });
  it("TESTTESTtranslate()", async () => {
    let dlt = new DeepLTranslator();
    let res = await dlt.translate("the dart of desire");
    let { text } = res;
    should(text).equal('o dardo do desejo');
  });
})
