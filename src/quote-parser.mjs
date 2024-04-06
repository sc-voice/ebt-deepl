import fs from "fs";
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const QUOTE  = '“'; // Quotation mark
const APOS   = "'"; // Apostrophe/single-quote
const LSQUOT = '‘'; // Left single quote
const RSQUOT = '’'; // \u2019 Right single quote, curly apostrophe
const LDGUIL = '«'; // Left double guillemet
const RDGUIL = '»'; // Right double guillemet
const LGUIL  = '\u2039'; // Left guillemet
const RGUIL  = '\u203a'; // Right guillemet
const NBSP   = '\u00a0'; // non-breaking space
const THNSP  = '\u2009'; // thin space
const LDQUOT = '“'; // Left double quote
const RDQUOT = '”'; // Right double quote
const ELLIPSIS = '…';

const FR_QUOTES = '«\|»\|“\|”\|‘\|’';
const RE_POST_APOS = /^\w/;

// Deepl 
const LQ1 = '<l1/>'; 
const LQ2 = '<l2/>';
const LQ3 = '<l3/>';
const LQ4 = '<l4/>';
const RQ1 = ' <r1/>'; // DeepL deletes trailing XML elements
const RQ2 = ' <r2/>'; // DeepL deletes trailing XML elements
const RQ3 = ' <r3/>'; // DeepL deletes trailing XML elements
const RQ4 = ' <r4/>'; // DeepL deletes trailing XML elements
const ELL = '<ell/>';

import { DBG, } from './defines.mjs';

export default class QuoteParser {
  constructor(opts={}) {
    const msg = 'QuoteParser.ctor()';
    const dbg = DBG.QUOTE;
    let {
      lang = 'en',
      openQuotes,
      closeQuotes,
      apostrophe = RSQUOT,
      level = 0,
      maxLevel = 4,
      quotes = 0,
    } = opts;

    lang = lang.toLowerCase();
    openQuotes = openQuotes && [...openQuotes];
    closeQuotes = closeQuotes && [...closeQuotes];

    switch (lang) {
      case 'en-uk': // UK quote nesting
        openQuotes = openQuotes || [ LSQUOT, LDQUOT, LSQUOT, LDQUOT ];
        closeQuotes = closeQuotes || [ RSQUOT, RDQUOT, RSQUOT, RDQUOT ];
        break;
      case 'pt-br':
      case 'en-us':
      case 'en': // American quote nesting 
        openQuotes = openQuotes || [ LDQUOT, LSQUOT, LDQUOT, LSQUOT ];
        closeQuotes = closeQuotes || [ RDQUOT, RSQUOT, RDQUOT, RSQUOT ];
        break;
      case 'nl':
        openQuotes = openQuotes || [ LDQUOT, LDQUOT,LDQUOT,  LDQUOT, ];
        closeQuotes = closeQuotes || [ RDQUOT, RDQUOT,RDQUOT,  RDQUOT, ];
        break;
      case 'it':
      case 'es':
      case 'pt':
      case 'pt-pt':
        openQuotes = openQuotes || [ LDGUIL, LDQUOT, LSQUOT, LDQUOT ];
        closeQuotes = closeQuotes || [ RDGUIL, RDQUOT, RSQUOT, RDQUOT ];
        break;
      case 'fr-eu':
        openQuotes = openQuotes || 
          [ LDGUIL+THNSP, LDQUOT, LSQUOT, ];
        closeQuotes = closeQuotes || 
          [ THNSP+RDGUIL, RDQUOT, RSQUOT, ];
        break;
      case 'fr':
        openQuotes = openQuotes || 
          [ LDGUIL+THNSP, LGUIL+THNSP, LDQUOT, LSQUOT, ];
        closeQuotes = closeQuotes || 
          [ THNSP+RDGUIL, THNSP+RGUIL, RDQUOT, RSQUOT, ];
        break;
      default: {
        if (lang.endsWith('-deepl')) {
          openQuotes = openQuotes || [ LQ1, LQ2, LQ3, LQ4 ];
          closeQuotes = closeQuotes || [ RQ1, RQ2, RQ3, RQ4 ];
          apostrophe = APOS;
        } else {
          let emsg = `${msg} unsupported language:${lang}`;
          throw new Error(emsg);
        }
      } break;
    }
    
    let quoteMap = {};
    let allQuotes = [...openQuotes, ...closeQuotes ]
      .reduce((a,q)=>{
        if (quoteMap[q] == null) {
          quoteMap[q] = true;
          a.push(q);
        }

        return a;
      },[]);
    let rexSplit = new RegExp(`(${allQuotes.join('|')})`);
    let rexQuotes = new RegExp(`(${allQuotes.join('|')})`, 'g');
    for (let i=0; i<maxLevel; i++) {
      openQuotes[i] = openQuotes[i] || openQuotes[i-1];
      closeQuotes[i] = closeQuotes[i] || closeQuotes[i-1];
    }

    let rexPreApos = QuoteParser.loadApostrophe(lang);
    if (rexPreApos) {
      this.rexPreApos = rexPreApos;
    }

    Object.assign(this, {
      apostrophe,
      closeQuotes,
      lang,
      level,
      openQuotes,
      rexQuotes,
      rexSplit,
      maxLevel,
      quotes,
    });
    dbg && console.log(msg, lang);
  }

  static loadApostrophe(lang) {
    const msg = 'QuoteParser.loadApostrophe()';
    const dbg = 0;
    let majorLang = lang.split('-')[0];
    let fname = `apostrophe_${majorLang}.txt`;
    let fpath = path.join(__dirname, './glossary', fname);
    let rex;
    try {
      let text = fs.readFileSync(fpath).toString().trim();
      let lines = text.split("’\n")
        .map(line=>line && `\\b${line}$`);
      rex = new RegExp(lines.join('|'), 'ig');
      dbg && console.log(msg, `[1]${lang}`, rex);
    } catch (e) {
      dbg && console.warn(msg, '[2]No apostrophe info:', fname);
    }
    return rex;
  }

  static testcaseQ2EN(lang) {
    const {LQ1, LQ2, LQ3, LQ4, RQ1, RQ2, RQ3, RQ4} = QuoteParser;
    return [
      // LQ1 in preceding segment
      `${LQ2}I say, `,
      `${LQ3}You say, `,
      `${LQ4}I said ${lang}!${RQ4}`,
      `?${RQ3}.`,
      `${RQ2}`,
      `${RQ1}`, // closing 
    ].join('');
  }

  static testcaseDepthEN(lang) {
    const {LQ1, LQ2, LQ3, LQ4, RQ1, RQ2, RQ3, RQ4} = QuoteParser;
    return [
      `${LQ1}`,
      `${LQ2}I say, `,
      `${LQ3}You say, `,
      `${LQ4}I said ${lang}!${RQ4}`,
      `?${RQ3}.`,
      `${RQ2}`,
      `${RQ1}`,
    ].join('');
  }

  static testcaseElderlyEN(opts={}) {
    let {
      lang='messenger',
      lQuote='',
      rQuote='',
      gods='gods',
    } = opts;
    return [
      lQuote,
      `Mister, did you not see among human beings an `,
      `elderly woman or a man—eighty, ninety, or a hundred `,
      `years old—bent double, crooked, leaning on a staff, `,
      `trembling as they walk, ailing, past their prime, `,
      `with teeth broken, hair grey and scanty or bald, `,
      `skin wrinkled, and limbs blotchy?`,
      rQuote,
    ].join('');
  }

  static testcaseSickEN(opts={}) {
    let {
      lang='sickness',
      lQuote1='',
      rQuote1='',
      rQuote2='',
      apos="'",
    } = opts;
    return [
      lQuote1,
      `I, too, am liable to become sick. I${apos}m not exempt `,
      `from ${lang}. I${apos}d better do good by way of body, `,
      `speech, and mind`,
      rQuote1,
      '?',
      rQuote2,
    ].join('');
  }

  static testcaseMisterEN(opts={}) {
    let {
      lang='messenger',
      lQuote='',
      rQuote='',
      gods='gods',
    } = opts;
    return [
      lQuote,
      `Mister, did you not see the first ${lang} of the ${gods} that appeared among human beings?`,
      rQuote,
    ].join('');
  }

  static testcaseQuotesEN(opts={}) {
    let {
      lang='mind',
      lQuote='',
      rQuote='',
    } = opts;
    return `${lQuote}Listen and apply your ${lang} well, I will speak.${rQuote}`;o
  }

  static testcaseDonationEN(opts={}) {
    let {
      lang='religious',
      people='kinds of people',
      lQuote='',
      rQuote='',
      apos="'",
    } = opts;
    return [
      `${lQuote}These are two ${people} in the world`,
      `who are worthy of a ${lang} donation,`,
      `and that${apos}s where you should give a gift.${rQuote} `,
    ].join(' ');
  }

  static testcaseEllipsisEN(lang, opts=QuoteParser) {
    const {
      prefix='They understand: ',
      lQuote=LDQUOT, 
      rQuote=RDQUOT, 
      ellipsis=` ${ELLIPSIS} `,
    } = opts;
    return [
      prefix,
      lQuote,
      `This is ${lang}`,
      rQuote,
      ellipsis,
      lQuote,
      'This is suffering',
      rQuote,
      ellipsis,
      lQuote,
      'This is the origin',
      rQuote,
      '.',
    ].join('');
  }

  static testcaseThinking_EN(lang, opts={}) {
    const {LQ1, RQ1, } = QuoteParser;
    let {lQuote=LQ1, rQuote=RQ1 } = opts;

    return [
      `Thinking, `,
      `${lQuote}I${APOS}ve done ${lang} `,
      `things by way of body, speech, and mind`,
      `${rQuote}, they${APOS}re mortified.`
    ].join('');
  }

  static get APOS() { return APOS; }
  static get ELLIPSIS() { return ELLIPSIS; }
  static get ELL() { return ELL; }
  static get LDQUOT() { return LDQUOT; }
  static get RDQUOT() { return RDQUOT; }
  static get LSQUOT() { return LSQUOT; }
  static get RSQUOT() { return RSQUOT; }
  static get LGUIL() { return LGUIL; }
  static get RGUIL() { return RGUIL; }
  static get LDGUIL() { return LDGUIL; }
  static get RDGUIL() { return RDGUIL; }
  static get NBSP() { return NBSP; }
  static get THNSP() { return THNSP; }
  static get QUOTE() { return QUOTE; }
  static get LQ1() { return LQ1; }
  static get LQ2() { return LQ2; }
  static get LQ3() { return LQ3; }
  static get LQ4() { return LQ4; }
  static get RQ1() { return RQ1; }
  static get RQ2() { return RQ2; }
  static get RQ3() { return RQ3; }
  static get RQ4() { return RQ4; }

  // ...APOS...
  testcaseGratificationEN(lang) {
    const apos = this.apostrophe;
    const [ LQ1, LQ2, LQ3, LQ4 ] = this.openQuotes;
    const [ RQ1, RQ2, RQ3, RQ4 ] = this.closeQuotes;

    return `‘But reverends, what${apos}s the gratification, `+
      `the drawback, and the escape when it comes to ${lang}`;
  }

  // ...APOS...
  testcasePleasuresEN(lang) {
    const apos = this.apostrophe;
    const [ LQ1, LQ2, LQ3, LQ4 ] = this.openQuotes;
    const [ RQ1, RQ2, RQ3, RQ4 ] = this.closeQuotes;

    return `understand ${lang} pleasures${apos} `+
      `gratification, drawback, and escape`;
  }

  // ...APOS...RQ1 RQ2
  testcaseSquirrelsEN(lang) {
    const apos = this.apostrophe;
    const [ LQ1, LQ2, LQ3, LQ4 ] = this.openQuotes;
    const [ RQ1, RQ2, RQ3, RQ4 ] = this.closeQuotes;

    return `the ${lang} squirrels${apos} feeding ground${RQ2}${RQ1}`;
  }

  // LQ2.....RQ2 RQ1
  testcaseRebirthEN(lang) {
    const [ LQ1, LQ2, LQ3, LQ4 ] = this.openQuotes;
    const [ RQ1, RQ2, RQ3, RQ4 ] = this.closeQuotes;
    return [
      //`${LQ1}`,
      `${LQ2}I understand: `,
      `${LQ3}`,
      `Rebirth is ended in ${lang}`,
      `${RQ3}`,
      `${RQ2}`,
      '?',
      `${RQ1}`,
    ].join('');
  }

  // ... RQ2
  testcaseFeelingsEN(lang) {
    const apos = this.apostrophe;
    const [ RQ1, RQ2, RQ3, RQ4 ] = this.closeQuotes;
    return [
      `what${apos}s the escape from that ${lang} feeling?${RQ2}`  
    ].join('');
  }

  // ... RQ1
  testcaseReligionsEN(lang) {
    const [ LQ1, LQ2, LQ3, LQ4 ] = this.openQuotes;
    const [ RQ1, RQ2, RQ3, RQ4 ] = this.closeQuotes;
    return [
      `Why don't we visit ${lang} religions?${RQ1} `,
    ].join('');
  }

  testcaseApostropheEN(lang) {
    const { apostrophe } = this;
    return `The ${lang} child${apostrophe}s toy`;
  }

  testcaseApostropheFR(lang) {
    const { apostrophe } = this;
    return `Le jouet de l${apostrophe}enfant ${lang}`;
  }

  scan(text, level=this.level) {
    const msg = 'QuoteParser.scan()';
    const dbg = DBG.QUOTE;
    const dbgv = DBG.VERBOSE && dbg;
    let { 
      rexQuotes, openQuotes, closeQuotes, maxLevel,
    } = this;
    let quotes = 0;
    let execRes;
    while ((execRes=rexQuotes.exec(text)) !== null) {
      let match = execRes[0];
      dbgv && console.log(msg, match);
      quotes++;
      if (match === closeQuotes[level-1]) {
        level--;
        if (level < 0) {
          let emsg = `${msg} unmatched close quote: ${text}`;
          console.warn(msg, emsg);
          throw new Error(emsg);
        }
      } else if (match === openQuotes[level]) {
        level++;
        if (maxLevel < level) {
          let emsg = `${msg} quote nesting exceeded: ${text}`;
          console.warn(msg, emsg);
          throw new Error(emsg);
        }
      } else {
        let emsg = `${msg} invalid quote [${match}] for level:${level}`;
        console.warn(msg, emsg);
        throw new Error(emsg);
      }
    }

    return { 
      level, 
      quotes,
    };
  }

  parse(text, level) {
    const msg = 'QuoteParser.parse()';
    const dbg = DBG.QUOTE;
    let dState = this.scan(text, level);
    if (dbg) {
      console.log(msg, dState);
    }

    this.level = dState.level;
    this.quotes += dState.quotes;

    return dState;
  }

  isApostrophe(context) {
    const msg = 'QuoteParser.isApostrophe()';
    const dbg = 0;
    const [ before, quote, after ] = context;
    let { rexPreApos } = this;

    if (quote !== RSQUOT) {
      dbg && console.log(msg, '[1]!RSQUOT', context);
      return false;
    }
    if (rexPreApos && rexPreApos.test(before)) {
      dbg && console.log(msg, '[2]rexPreApos', before);
      return true;
    }
    if (after === '') {
      dbg && console.log(msg, '[3]$', context);
      return false;
    }
    if (RE_POST_APOS.test(after)) {
      dbg && console.log(msg, '[4]RE_POST_APOS', context);
      return true;
    }

    dbg && console.log(msg, '[5]RSQUOT', context);
    return false;
  }

  convertQuotes(text='', qpSwap, level=this.level) {
    const msg = 'QuoteParser.convertQuotes()';
    const dbg = 0 || DBG.VERBOSE;
    let { 
      openQuotes:srcOpen, 
      closeQuotes:srcClose, 
      apostrophe:srcApos,
      rexSplit,
      maxLevel,
    } = this;
    if (qpSwap == null || text=='') {
      return text;
    }
    let {
      openQuotes:swapOpen,
      closeQuotes:swapClose,
      apostrophe:swapApos,
    } = qpSwap;

    let dstParts = [];
    let srcParts = text.split(rexSplit);
    dbg && console.log(msg, '[1]srcParts', srcParts);
    let lastPart;
    let nextPart = srcParts[0];
    for (let i=0; i<srcParts.length; i++) {
      let part = nextPart;
      let srcOpenQuote = srcOpen[level];
      let srcCloseQuote = srcClose[level-1];

      if (i%2 === 0) {
        dbg && console.log(msg, `[2]text@${i}`, part);
      } else if (part === srcCloseQuote) {
        let nextPart = srcParts[i+1];
        let context = [srcParts[i-1], part, nextPart];
        if (this.isApostrophe(context)) {
          dbg && console.log(msg, `[3]apos@${i}`, {part, nextPart});
        } else {
          dbg && console.log(msg, `[4]close@${i}`, {part, nextPart});
          level--;
          part = swapClose[level];
          if (level < 0) {
            let emsg = `${msg} unmatched close quote: ${text}`;
            console.warn(msg, emsg);
            throw new Error(emsg);
          }
        }
      } else if (part === srcOpenQuote) {
        dbg && console.log(msg, `[5]open@${i}`, part);
        part = swapOpen[level];
        level++;
        if (maxLevel < level) {
          let emsg = `${msg} quote nesting exceeded: ${text}`;
          console.warn(msg, emsg);
          throw new Error(emsg);
        }
      } else {
        dbg && console.log(msg, `[6]skip@${i}`, level, 
          `"${part}"`, 
        );
        // not a quote
      }
      dstParts.push(part)
      lastPart = part;
      nextPart = srcParts[i+1];
    }
    this.level = level;

    let aposParts =  dstParts.join('').split(srcApos);
    dbg && console.log(msg, '[7]aposParts', 
      aposParts, swapApos.charCodeAt(0));

    return aposParts.join(swapApos);
  }

  #checkQuoteLevel(text='', startLevel=0) {
    const msg = `qp-${this.lang}.#checkQuoteLevel()`;
    const dbg = DBG.QUOTE;
    const dbgv = dbg && DBG.VERBOSE;
    let endLevel = startLevel;
    let syncLevel = startLevel;
    let levelError = 0;
    let { maxLevel, rexSplit, openQuotes, closeQuotes } = this;
    let parts = text.split(rexSplit);
    let error;

    if (parts.length === 1) {
      dbg && console.log(msg, `[1]no-quotes${startLevel}`, 
        text.substring(0,50), '...');
    }
    for (let i=1; !error && i<parts.length; i+=2) {
      let part = parts[i]; // parts with odd indices are quotes
      let context = [parts[i-1], part, parts[i+1]];

      if (part === openQuotes[endLevel]) { // sync ok
        endLevel++;
        dbg && console.log(msg, `[2]open${endLevel}`, 
          context.join('|'));
      } else if (part === closeQuotes[endLevel-1]) {
        if (this.isApostrophe(context)) {
          dbgv && console.log(msg, `[3]apos`, context.join('|'));
        } else {
          dbg && console.log(msg, `[4]close${endLevel}`, 
            context.join('|'));
          endLevel--;
        }
      } else if (this.isApostrophe(context)) {
        dbgv && console.log(msg, `[5]apos`, context.join('|'));
      } else { // sync fail
        let emsg = `${msg} ERROR [${startLevel}?${text}]`;
        dbg && console.log(msg, `[6]SYNC?`, {startLevel, i, context, }); 
        error = new Error(emsg);
      }
    }
    return {
      error,
      startLevel,
      endLevel,
    }
  }

  syncQuoteLevel(text='', startLevel=0) {
    const msg = `qp-${this.lang}.syncQuoteLevel()`;
    const dbg = DBG.QUOTE;
    let { maxLevel } = this;
    let check  = this.#checkQuoteLevel(text, startLevel);
    if (check.error) {
      for (let i=1; check.error && i<maxLevel; i++) {
        let tryLevel = (startLevel + i) % maxLevel;
        check = this.#checkQuoteLevel(text, tryLevel);
      }
      if (check.error) {
        // Could not synchronize quotes. Source document error
        console.log(msg, '[1]SYNC?!', `level ${startLevel}=>ERROR`);
        throw check.error;
      }

      // Synchronized, but source document might be in error
      console.log(msg, '[2]SYNC?', 
        `level ${startLevel}=>${check.startLevel}`,
        `\n  |${text}|`);
    }
    return check;
  }

}
