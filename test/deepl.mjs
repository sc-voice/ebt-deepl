import should from "should";
import { execSync } from "child_process";
import { logger } from "log-instance/index.mjs";
import { default as DeepLTranslator } from "../src/deepl.mjs";

(typeof describe === 'function') && describe("deepl", function() {
  this.timeout(10*1000);
  var logLevel = false;

  it("TESTTESTcreate() default", async() => {
    let dlt = await DeepLTranslator.create();
    should(dlt).properties({
      srcLang: 'EN',
      dstLang: 'pt-PT',
      glossaryName: 'en_pt-pt.kv',
      glossary: 'desire\tanseio\n',
    });
  });
  it("TESTTESTcreate() custom", async() => {
    let srcLang = 'pt-PT';
    let dstLang = 'en';
    let dlt = await DeepLTranslator.create({
      srcLang,
      dstLang,
    });
    should(dlt).properties({
      srcLang,
      dstLang,
    });
  });
  it("TESTTESTtranslate()", async () => {
    let dlt = await DeepLTranslator.create();
    await dlt.initialize();

    // sujato
    let res = await dlt.translate([
      "the dart of desire",
      "“Mendicant, you seek alms before you eat;",
    ]);

    should(res[0].text).equal('o dardo do desejo');
    should(res[0].detectedSourceLang).equal('en');

    // Compare with laera-quaresma:
    // '“Bhikkhu, você esmola comida antes de comer (desfrutar); "');
    should(res[1].text).equal(
      '"Bhikkhu, você pede esmola antes de comer;');
    should(res[1].detectedSourceLang).equal('en');
  });
  it("TESTTESTglossaries()", async() =>{
    let dlt = await DeepLTranslator.create();
    let glossaries = await dlt.glossaries();
    should(glossaries).instanceOf(Array);
    console.log({glossaries});
  });
})
