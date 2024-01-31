
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
      openQuotes: [ LDQUOT, LSQUOT, LDQUOT, LSQUOT ],
      closeQuotes: [ RDQUOT, RSQUOT, RDQUOT, RSQUOT ],
      level: 0,
    });
  });
  it("custom ctor()", ()=>{
    let qp_fr = new QuoteParser({
      lang: 'fr',
      level: 1,
    });
    should(qp_fr).properties({
      lang : 'fr',
      openQuotes: [ LGUIL+NBSP, LDQUOT, LSQUOT, LDQUOT ],
      closeQuotes: [ NBSP+RGUIL, RDQUOT, RSQUOT, RDQUOT ],
      level: 1,
    });

    let qp_pt = new QuoteParser({
      lang: 'pt',
      level: 2,
    });
    should(qp_pt).properties({
      lang : 'pt',
      openQuotes: [ LGUIL, LDQUOT, LSQUOT, LDQUOT ],
      closeQuotes: [ RGUIL, RDQUOT, RSQUOT, RDQUOT ],
      level: 2,
    });

    let qp_br = new QuoteParser({
      lang: 'pt-BR',
      level: 3,
    });
    should(qp_br).properties({
      lang : 'pt-br',
      openQuotes: [ LDQUOT, LSQUOT, LDQUOT, LSQUOT ],
      closeQuotes: [ RDQUOT, RSQUOT, RDQUOT, RSQUOT ],
      level: 3,
    });

    let openQuotes = [ '{', '<' ];
    let closeQuotes = [ '}', '>' ];
    let qp_q = new QuoteParser({openQuotes, closeQuotes});
    should(qp_q).properties({
      openQuotes: [ '{', '<', '<', '<' ], 
      closeQuotes: [ '}', '>', '>', '>' ]
    });
  });
  it("rexQuotes()", ()=>{
    let qp = new QuoteParser();
    let [ L2, L1 ] = qp.openQuotes;
    let [ R2, R1 ] = qp.closeQuotes;
    let text = `a${L2}b${L1}c${R1}d${R2}e`;
    should(text.replaceAll(qp.rexQuotes, 'X')).equal('aXbXcXdXe');
  });
  it("parse()", ()=>{
    let qp = new QuoteParser();
    let [ L1, L2, L3 ] = qp.openQuotes;
    let [ R1, R2, R3 ] = qp.closeQuotes;
    should(qp.parse(`abc`)).properties({level:0, quotes:0 });
    should(qp.parse(`${L1}abc`)).properties({level:1, quotes:1 });
    should(qp.parse(`abc`)).properties({level:1, quotes:0});
    should(qp.parse(`${R1}abc`)).properties({level:0, quotes:1 });

    // Supplied state
    should(qp.parse(`a${R3}b${R2}c`,3)).properties({ level:1, quotes:2 });
    should(qp.parse(`${L1}abc`,0)).properties({level:1, quotes:1 });
    should(qp.parse(`${R1}abc`,1)).properties({level:0, quotes:1 });

    should(qp.parse(`${L1}a${L2}b${L3}c`))
      .properties({level:3, quotes:3});
    should(qp.parse(`${L1}a${L2}b${L3}c`, 0))
      .properties({level:3, quotes:3});
    should(qp.parse(`a${R3}b${R2}c`)).properties({ level:1, quotes:2 });
    should(qp.parse(`abc`)).properties({ level:1, quotes:0 });
    should(qp.parse(`${R1}bc`)).properties({ level:0, quotes:1 });
  });
  it("parse() deepl", ()=>{
    let qp = new QuoteParser({lang:'en-deepl'});
    let [ L1, L2, ] = qp.openQuotes;
    let [ R1, R2, ] = qp.closeQuotes;
    should(qp.parse(`abc`)).properties({level: 0, quotes:0 });
    should(qp.parse(`${L1}abc`)).properties({level: 1, quotes:1 });
    should(qp.parse(`abc`)).properties({level: 1, quotes:0});
    should(qp.parse(`${R1}abc`)).properties({level: 0, quotes:1 });
    should(qp.parse(`${R1}abc`, 1)).properties({level: 0, quotes:1 });

    should(qp.parse(`${L1}a${L2}bc`))
      .properties({level: 2, quotes:2});
    should(qp.parse(`ab${R2}c`)).properties({ level: 1, quotes:1 });
    should(qp.parse(`abc`)).properties({ level: 1, quotes:0 });
    should(qp.parse(`${R1}bc`)).properties({ level: 0, quotes:1 });
  });
  it("convertQuotes() balanced", ()=>{
    let usText =  `“I say: ‘completed’”? `;
    let ukText =  `‘I say: “completed”’? `;
    let qp_us = new QuoteParser({lang:'en-us'});
    let qp_uk = new QuoteParser({lang:'en-uk'});

    should(qp_us.convertQuotes(usText, qp_uk)).equal(ukText);
    should(qp_uk.convertQuotes(ukText, qp_us)).equal(usText);
    should(qp_us.level).equal(0);
    should(qp_uk.level).equal(0);

    should(qp_us.convertQuotes(usText, qp_uk,0)).equal(ukText);
    should(qp_uk.convertQuotes(ukText, qp_us,0)).equal(usText);
    should(qp_us.level).equal(0);
    should(qp_uk.level).equal(0);

    should(qp_us.convertQuotes(ukText, qp_uk, 1)).equal(usText);
    should(qp_uk.convertQuotes(usText, qp_us, 1)).equal(ukText);
    should(qp_us.level).equal(1);
    should(qp_uk.level).equal(1);
  });
  it("convertQuotes() unbalanced", ()=>{
    let usText =  `‘I say: “completed”’?”`; // level 1
    let ukText =  `“I say: ‘completed’”?’`; // level 1
    let qp_us = new QuoteParser({lang:'en-us'});
    let qp_uk = new QuoteParser({lang:'en-uk'});

    should(qp_us.convertQuotes(usText, qp_uk, 1)).equal(ukText);
    should(qp_uk.convertQuotes(ukText, qp_us, 1)).equal(usText);
    should(qp_us.level).equal(0);
    should(qp_uk.level).equal(0);

    should(qp_us.convertQuotes(ukText, qp_uk, 2)).equal(usText);
    should(qp_uk.convertQuotes(usText, qp_us, 2)).equal(ukText);
    should(qp_us.level).equal(1);
    should(qp_uk.level).equal(1);
  });
  it("preTranslate()", ()=>{
    return; // TODO
    let openQuotes = [ '{', '<' ];
    let closeQuotes = [ '}', '>' ];
    let qp = new QuoteParser({openQuotes, closeQuotes});

    // Balanced depth 1
    should(qp.preTranslate('a<b>c', 0)).equal('{a<b>c}');

    // Unbalanced depth 1
    should(qp.preTranslate('a<bc', 0)).equal('{a<bc>}');
    should(qp.preTranslate('ab>c', 0)).equal('{<ab>c}');

    // Unbaanced depth 0
    should(qp.preTranslate('a{bc', 0)).equal('a{bc}');
    should(qp.preTranslate('ab}c', 0)).equal('{ab}c');

    // Balanced depth 0
    should(qp.preTranslate(`{a<b>c<d>e}`, 0)).equal(`{a<b>c<d>e}`);
    should(qp.preTranslate(`{a}b{c}`, 0)).equal(`{a}b{c}`);
    should(qp.preTranslate(`{abc}`, 0)).equal(`{abc}`);
    should(qp.preTranslate(`abc`, 0)).equal(`abc`);
  });
  it("TESTTESTquotationLevel", ()=>{
    let usText =  `“I say: ‘completed’”? `;
    let ukText =  `‘I say: “completed”’? `;
    let qp_us = new QuoteParser({lang:'en-us'});
    let qp_uk = new QuoteParser({lang:'en-uk'});

    should(qp_us.quotationLevel(usText)).equal(0);
    should(qp_uk.quotationLevel(ukText)).equal(0);
    should(qp_us.quotationLevel(ukText)).equal(1);
    should(qp_uk.quotationLevel(usText)).equal(1);
  });
})
