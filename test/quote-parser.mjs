import should from "should";

import { 
  QuoteParser 
} from "../index.mjs";
import { 
  DBG,
} from '../src/defines.mjs';
const { 
  LDQUOT, RDQUOT, LSQUOT, RSQUOT, LDGUIL, RDGUIL, NBSP,
  THNSP, LGUIL, RGUIL,
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
    let { rexPreApos } = qp;
    should(rexPreApos).instanceOf(RegExp);
    should('the squirrels').match(rexPreApos);
    should('the skuirrels').not.match(rexPreApos);
    should('thesquirrels').not.match(rexPreApos);
  });
  it("custom ctor()", ()=>{
    let qp_fr = new QuoteParser({
      lang: 'fr',
      level: 1,
    });
    should(qp_fr).properties({
      lang : 'fr',
      openQuotes: [ LDGUIL+THNSP, LGUIL+THNSP, LDQUOT, LSQUOT, ],
      closeQuotes: [ THNSP+RDGUIL, THNSP+RGUIL, RDQUOT, RSQUOT, ],
      level: 1,
    });

    let qp_pt = new QuoteParser({
      lang: 'pt',
      level: 2,
    });
    should(qp_pt).properties({
      lang : 'pt',
      openQuotes: [ LDGUIL, LDQUOT, LSQUOT, LDQUOT ],
      closeQuotes: [ RDGUIL, RDQUOT, RSQUOT, RDQUOT ],
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
  it("rexQuotes() en-us", ()=>{
    const msg = 'test.QuoteParser.rexQuotes()';
    let qp = new QuoteParser();
    let [ L2, L1 ] = qp.openQuotes;
    let [ R2, R1 ] = qp.closeQuotes;
    let text = `a${L2} b${L1} c${R1} d${R1}${R2} e${R1}`;
    let parts = text.split(qp.rexSplit);
    //console.log(msg, qp.rexSplit, parts);
    should.deepEqual(parts, [
      'a', L2, ' b', L1, ' c', R1, ' d', R1, '', R2, ' e', R1, '',
    ]);
  });
  it("parse()", ()=>{
    let qp = new QuoteParser({lang:'en-deepl'});
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
  it("convertQuotes() testcaseFeelingsEN() French", ()=>{
    const msg = 'test.QuoteParser.convertQuotes()';
    let qp_en = new QuoteParser({lang:'en'});
    let qp_en_deepl = new QuoteParser({lang:'en-deepl'});
    let enText = qp_en.testcaseFeelingsEN('French');
    let preText = qp_en_deepl.testcaseFeelingsEN('French');
    //console.log(msg, {enText, preText});

    should(qp_en.convertQuotes(enText, qp_en_deepl, 2))
    .equal(preText);
  });
  it("convertQuotes() testcaseGratificationEN() French", ()=>{
    const msg = 'test.QuoteParser.convertQuotes()';
    let qp_en = new QuoteParser({lang:'en'});
    let qp_en_deepl = new QuoteParser({lang:'en-deepl'});
    let enText = qp_en.testcaseGratificationEN('French');
    let preText = qp_en_deepl.testcaseGratificationEN('French');
    //console.log(msg, {enText, preText});

    should(qp_en.convertQuotes(enText, qp_en_deepl, 2))
    .equal(preText);
  });
  it("convertQuotes() testcasePleasuresEN() French", ()=>{
    const msg = 'test.QuoteParser.convertQuotes()';
    let qp_en = new QuoteParser({lang:'en'});
    let qp_en_deepl = new QuoteParser({lang:'en-deepl'});
    let enText = qp_en.testcasePleasuresEN('French');
    let preText = qp_en_deepl.testcasePleasuresEN('French');
    //console.log(msg, {enText, preText});

    should(qp_en.convertQuotes(enText, qp_en_deepl, 2))
    .equal(preText);
  });
  it("convertQuotes() testcaseSquirrelsEN() French", ()=>{
    const msg = 'test.QuoteParser.convertQuotes()';
    let qp_en = new QuoteParser({lang:'en'});
    let qp_en_deepl = new QuoteParser({lang:'en-deepl'});
    let enText = qp_en.testcaseSquirrelsEN('French');
    let preText = qp_en_deepl.testcaseSquirrelsEN('French');
    //console.log(msg, {enText, preText});

    should(qp_en.convertQuotes(enText, qp_en_deepl, 2))
    .equal(preText);
  });
  it("quotationLevel() en us/uk", ()=>{
    let usText =  `“I say: ‘completed’”? `;
    let ukText =  `‘I say: “completed”’? `;
    let qp_us = new QuoteParser({lang:'en-us'});
    let qp_uk = new QuoteParser({lang:'en-uk'});

    should(qp_us.quotationLevel(usText)).equal(0);
    should(qp_uk.quotationLevel(ukText)).equal(0);
    should(qp_us.quotationLevel(ukText)).equal(1);
    should(qp_uk.quotationLevel(usText)).equal(1);
  });
  it("quotationLevel() testcaseFeelingsEN FR", ()=>{
    const msg = 'test.QuoteParser.quotationLevel()';
    const dbg = 0;

    let qp_en = new QuoteParser({lang:'en'});
    let enText = qp_en.testcaseFeelingsEN('French');
    dbg && console.log(msg, enText);
    should(qp_en.quotationLevel(enText)).equal(2);

    let qp_pre = new QuoteParser({lang:'en-deepl'});
    let preText = qp_pre.testcaseFeelingsEN('French');
    dbg && console.log(msg, preText);
    should(qp_pre.quotationLevel(preText)).equal(2);
  });
  it("quotationLevel() testcaseReligionsEN FR", ()=>{
    const msg = 'test.QuoteParser.quotationLevel()';
    const dbg = 0;

    let qp_en = new QuoteParser({lang:'en'});
    let enText = qp_en.testcaseReligionsEN('French');
    should(qp_en.quotationLevel(enText)).equal(1);
    dbg && console.log(msg, qp_en.rexSplit, enText);

    let qp_pre = new QuoteParser({lang:'en-deepl'});
    let preText = qp_pre.testcaseReligionsEN('French');
    dbg && console.log(msg, qp_pre.rexSplit, preText);
    should(qp_pre.quotationLevel(preText)).equal(1);
  });
  it("syncQuoteLevel() startLevel", ()=>{
    const msg = 'test.QuoteParser@227';
    const dbg = DBG.QUOTE;
    let qp = new QuoteParser({lang:'en'});
    dbg && console.log(msg, '[1]rexSplit', qp.rexSplit);
    let [ lq1, lq2, lq3, lq4 ] = qp.openQuotes;
    let [ rq1, rq2, rq3, rq4 ] = qp.closeQuotes;
    let tests = [
      `a`, // 0,1,2,3
      `${lq1}a${rq1}`, // 0,2
      `${lq2}a${rq2}`, // 1,3
      `a${rq2}`, // 2,4
      `${lq3}a${rq3}?${rq2}`, // 2
      `${lq2}a${rq2}${rq1}`, // 1,2
    ];
    let i = -1;
    dbg && console.log(msg, `[2]`, tests[++i]);
    should(qp.syncQuoteLevel(tests[i], 0).startLevel).equal(0);
    should(qp.syncQuoteLevel(tests[i], 1).startLevel).equal(1);
    should(qp.syncQuoteLevel(tests[i], 2).startLevel).equal(2);
    should(qp.syncQuoteLevel(tests[i], 3).startLevel).equal(3);
    dbg && console.log(msg, `[3]`, tests[++i]);
    should(qp.syncQuoteLevel(tests[i], 0).startLevel).equal(0);
    should(qp.syncQuoteLevel(tests[i], 2).startLevel).equal(2);
    dbg && console.log(msg, `[4]`, tests[++i]);
    should(qp.syncQuoteLevel(tests[i], 1).startLevel).equal(1);
    should(qp.syncQuoteLevel(tests[i], 3).startLevel).equal(3);
    dbg && console.log(msg, `[5]`, tests[++i]);
    should(qp.syncQuoteLevel(tests[i], 2).startLevel).equal(2);
    should(qp.syncQuoteLevel(tests[i], 4).startLevel).equal(4);
    dbg && console.log(msg, `[6]`, tests[++i]);
    should(qp.syncQuoteLevel(tests[i], 2).startLevel).equal(2);
    dbg && console.log(msg, `[7]`, tests[++i]);
    should(qp.syncQuoteLevel(tests[i], 1).startLevel).equal(1);
    should(qp.syncQuoteLevel(tests[i], 3).startLevel).equal(3);
  });
  it("syncQuoteLevel() endLevel same", ()=>{
    const msg = 'test.QuoteParser@263';
    const dbg = DBG.QUOTE;
    let qp = new QuoteParser({lang:'en'});
    dbg && console.log(msg, '[1]rexSplit', qp.rexSplit);
    let [ lq1, lq2, lq3, lq4 ] = qp.openQuotes;
    let [ rq1, rq2, rq3, rq4 ] = qp.closeQuotes;
    let i;

    let testsSame = [ // Same quote level
      `a`, // 0,1,2,3
      `${lq1}a${rq1}`, // 0,2
      `${lq2}a${rq2}`, // 1,3
    ];
    i = 0;
    dbg && console.log(msg, `[2]`, testsSame[i]);
    should(qp.syncQuoteLevel(testsSame[i], 0).endLevel).equal(0);
    should(qp.syncQuoteLevel(testsSame[i], 1).endLevel).equal(1);
    should(qp.syncQuoteLevel(testsSame[i], 2).endLevel).equal(2);
    should(qp.syncQuoteLevel(testsSame[i], 3).endLevel).equal(3);
    ++i;
    dbg && console.log(msg, `[3]`, testsSame[i]);
    should(qp.syncQuoteLevel(testsSame[i], 0).endLevel).equal(0);
    should(qp.syncQuoteLevel(testsSame[i], 2).endLevel).equal(2);
    ++i;
    dbg && console.log(msg, `[4]`, testsSame[i]);
    should(qp.syncQuoteLevel(testsSame[i], 1).endLevel).equal(1);
    should(qp.syncQuoteLevel(testsSame[i], 3).endLevel).equal(3);
  });
  it("syncQuoteLevel() endLevel close", ()=>{
    const msg = 'test.QuoteParser@292';
    const dbg = DBG.QUOTE;
    let qp = new QuoteParser({lang:'en'});
    dbg && console.log(msg, '[1]rexSplit', qp.rexSplit);
    let [ lq1, lq2, lq3, lq4 ] = qp.openQuotes;
    let [ rq1, rq2, rq3, rq4 ] = qp.closeQuotes;
    let i;

    let testsClose = [ // Close quote to lower level
      `a${rq2}`, // 2,4
      `${lq3}a${rq3}?${rq2}`, // 2
      `${lq2}a${rq2}${rq1}`, // 1,2
    ];
    i = 0;
    dbg && console.log(msg, `[1]`, testsClose[i]);
    should(qp.syncQuoteLevel(testsClose[i], 2).endLevel).equal(1);
    should(qp.syncQuoteLevel(testsClose[i], 4).endLevel).equal(3);
    ++i;
    dbg && console.log(msg, `[2]`, testsClose[i]);
    should(qp.syncQuoteLevel(testsClose[i], 2).endLevel).equal(1);
    ++i;
    dbg && console.log(msg, `[3]`, testsClose[i]);
    should(qp.syncQuoteLevel(testsClose[i], 1).endLevel).equal(0);
    should(qp.syncQuoteLevel(testsClose[i], 3).endLevel).equal(2);
  });
  it("TESTTESTsyncQuoteLevel() endLevel open", ()=>{
    const msg = 'test.QuoteParser@292';
    const dbg = DBG.QUOTE;
    let qp = new QuoteParser({lang:'en'});
    dbg && console.log(msg, '[1]rexSplit', qp.rexSplit);
    let [ lq1, lq2, lq3, lq4 ] = qp.openQuotes;
    let [ rq1, rq2, rq3, rq4 ] = qp.closeQuotes;
    let i;

    let testsOpen = [ // Close quote to lower level
      `${lq2}${lq3}a${rq3}?`, // 1
      `${lq1}`, // 0,2
      `${lq2}a${rq2}${rq1}`, // 1,2
      `${lq2}a${lq3}${lq4}`, // 1
    ];
    i = -1;
    ++i;
    dbg && console.log(msg, `[1]`, testsOpen[i]);
    should(qp.syncQuoteLevel(testsOpen[i], 1).endLevel).equal(2);
    ++i
    dbg && console.log(msg, `[2]`, testsOpen[i]);
    should(qp.syncQuoteLevel(testsOpen[i], 0).endLevel).equal(1);
    should(qp.syncQuoteLevel(testsOpen[i], 2).endLevel).equal(3);
    ++i;
    dbg && console.log(msg, `[3]`, testsOpen[i]);
    should(qp.syncQuoteLevel(testsOpen[i], 1).endLevel).equal(0);
    should(qp.syncQuoteLevel(testsOpen[i], 3).endLevel).equal(2);
    ++i;
    dbg && console.log(msg, `[4]`, testsOpen[i]);
    should(qp.syncQuoteLevel(testsOpen[i], 1).endLevel).equal(4);
  });
  it("syncQuoteLevel() errors", ()=>{
    const msg = 'test.QuoteParser@318';
    const dbg = DBG.QUOTE;
    let qp = new QuoteParser({lang:'en'});
    dbg && console.log(msg, '[1]rexSplit', qp.rexSplit);
    let [ lq1, lq2, lq3, lq4 ] = qp.openQuotes;
    let [ rq1, rq2, rq3, rq4 ] = qp.closeQuotes;
    let tests = [
      `${lq1}a${rq1}`, // 0,2
      `${lq2}a${rq2}`, // 1,3
      `a${rq2}`, // 2,4
      `${lq3}a${rq3}?${rq2}`, // 2
      `${lq2}a${rq2}${rq1}`, // 1,2
    ];
    let i = 0;
    console.log(msg, "***** BEGIN syncQuoteLevel() error test");
    dbg && console.log(msg, `[2]`, tests[i]);
    should(qp.syncQuoteLevel(tests[i], 1).startLevel).equal(2);
    should(qp.syncQuoteLevel(tests[i], 3).startLevel).equal(0);
    should(qp.syncQuoteLevel(tests[i], 4).startLevel).equal(2);
    i++
    dbg && console.log(msg, `[3]`, tests[i]);
    should(qp.syncQuoteLevel(tests[i], 0).startLevel).equal(1);
    should(qp.syncQuoteLevel(tests[i], 2).startLevel).equal(3);
    should(qp.syncQuoteLevel(tests[i], 4).startLevel).equal(1);
    i++
    dbg && console.log(msg, `[4]`, tests[i]);
    should(qp.syncQuoteLevel(tests[i], 0).startLevel).equal(2);
    should(qp.syncQuoteLevel(tests[i], 1).startLevel).equal(2);
    should(qp.syncQuoteLevel(tests[i], 3).startLevel).equal(2);
    i++
    dbg && console.log(msg, `[5]`, tests[i]);
    should(qp.syncQuoteLevel(tests[i], 0).startLevel).equal(2);
    should(qp.syncQuoteLevel(tests[i], 1).startLevel).equal(2);
    should(qp.syncQuoteLevel(tests[i], 3).startLevel).equal(2);
    console.log(msg, "***** END syncQuoteLevel() error test");
  });
})
