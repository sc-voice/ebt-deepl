
import should from "should";

import { default as QuoteParser } from "../src/quote-parser.mjs";
import { 
  DBG_QUOTE,
} from '../src/defines.mjs';
const { 
  LDQUOT, RDQUOT, LSQUOT, RSQUOT, LGUIL, RGUIL, NBSP,
} = QuoteParser;

const MODULE = 'quote-parser';
(typeof describe==='function') && describe(MODULE, function() {
  it("default ctor()", ()=>{
    let qp = new QuoteParser();
    should(qp).properties({
      lang : 'en',
      openQuotes: [ LDQUOT, LSQUOT, LSQUOT, LSQUOT ],
      closeQuotes: [ RDQUOT, RSQUOT, RSQUOT, RSQUOT ],
      level: 0,
    });
  });
  it("TESTTESTcustom ctor()", ()=>{
    let qp_fr = new QuoteParser({
      lang: 'fr',
      level: 1,
    });
    should(qp_fr).properties({
      lang : 'fr',
      openQuotes: [ LGUIL+NBSP, LDQUOT, LSQUOT, LSQUOT ],
      closeQuotes: [ NBSP+RGUIL, RDQUOT, RSQUOT, RSQUOT ],
      level: 1,
    });

    let qp_pt = new QuoteParser({
      lang: 'pt',
      level: 2,
    });
    should(qp_pt).properties({
      lang : 'pt',
      openQuotes: [ LGUIL, LDQUOT, LSQUOT, LSQUOT ],
      closeQuotes: [ RGUIL, RDQUOT, RSQUOT, RSQUOT ],
      level: 2,
    });

    let qp_br = new QuoteParser({
      lang: 'pt-BR',
      level: 3,
    });
    should(qp_br).properties({
      lang : 'pt-br',
      openQuotes: [ LDQUOT, LSQUOT, LSQUOT, LSQUOT ],
      closeQuotes: [ RDQUOT, RSQUOT, RSQUOT, RSQUOT ],
      level: 3,
    });
  });
  it("rexQuotes()", ()=>{
    let qp = new QuoteParser();
    let [ L2, L1 ] = qp.openQuotes;
    let [ R2, R1 ] = qp.closeQuotes;
    let text = `a${L2}b${L1}c${R1}d${R2}e`;
    should(text.replaceAll(qp.rexQuotes, 'X')).equal('aXbXcXdXe');
  });
  it("TESTTESTparse()", ()=>{
    let qp = new QuoteParser();
    let [ L1, L2, L3 ] = qp.openQuotes;
    let [ R1, R2, R3 ] = qp.closeQuotes;
    should(qp.parse(`abc`)).properties({level:0, quotes:0 });
    should(qp.parse(`${L1}abc`)).properties({level:1, quotes:1 });
    should(qp.parse(`abc`)).properties({level:1, quotes:0});
    should(qp.parse(`${R1}abc`)).properties({level:0, quotes:1 });

    should(qp.parse(`${L1}a${L2}b${L3}c`))
      .properties({level: 3, quotes:3});
    should(qp.parse(`a${R3}b${R2}c`)).properties({ level:1, quotes:2 });
    should(qp.parse(`abc`)).properties({ level:1, quotes:0 });
    should(qp.parse(`${R1}bc`)).properties({ level:0, quotes:1 });
  });
  it("TESTTESTparse() deepl", ()=>{
    let qp = new QuoteParser({lang:'deepl'});
    let [ L1, L2, ] = qp.openQuotes;
    let [ R1, R2, ] = qp.closeQuotes;
    should(qp.parse(`abc`)).properties({level: 0, quotes:0 });
    should(qp.parse(`${L1}abc`)).properties({level: 1, quotes:1 });
    should(qp.parse(`abc`)).properties({level: 1, quotes:0});
    should(qp.parse(`${R1}abc`)).properties({level: 0, quotes:1 });

    should(qp.parse(`${L1}a${L2}bc`))
      .properties({level: 2, quotes:2});
    should(qp.parse(`ab${R2}c`)).properties({ level: 1, quotes:1 });
    should(qp.parse(`abc`)).properties({ level: 1, quotes:0 });
    should(qp.parse(`${R1}bc`)).properties({ level: 0, quotes:1 });
  });
  it("TESTTESTaddContext()", ()=>{
    return; // TODO
    let qp = new QuoteParser();
    let [ L1, L2, ] = qp.openQuotes;
    let [ R1, R2, ] = qp.closeQuotes;
    should(qp.addContext(`abc`, 0)).equal(`abc`);
    should(qp.addContext(`a${L2}b${R2}c`, 0))
      .equal(`${L1}a${L2}b${R2}c${R1}`);
  });
})
