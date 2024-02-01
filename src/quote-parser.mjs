const QUOTE  = '“'; // Quotation mark
const APOS   = "'"; // Apostrophe/single-quote
const LSQUOT = '‘'; // Left single quote
const RSQUOT = '’'; // Right single quote, curly apostrophe
const LGUIL  = '«'; // Left guillemet
const RGUIL  = '»'; // Right guillemet
const NBSP   = '\u00a0'; // non-breaking space
const LDQUOT = '“'; // Left double quote
const RDQUOT = '”'; // Right double quote

const FR_QUOTES = '«\|»\|“\|”\|‘\|’';

// Deepl 
const LQ1 = '<w>'; 
const LQ2 = '<x>';
const LQ3 = '<y>';
const LQ4 = '<z>';
const RQ1 = '</w>'; 
const RQ2 = '</x>';
const RQ3 = '</y>';
const RQ4 = '</z>';

import {
  DBG_QUOTE, DBG_VERBOSE,
} from './defines.mjs';

export default class QuoteParser {
  constructor(opts={}) {
    const msg = 'QuoteParser.ctor()';
    const dbg = DBG_QUOTE;
    let {
      lang = 'en',
      openQuotes,
      closeQuotes,
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
      case 'pt':
      case 'pt-pt':
        openQuotes = openQuotes || [ LGUIL, LDQUOT, LSQUOT, LDQUOT ];
        closeQuotes = closeQuotes || [ RGUIL, RDQUOT, RSQUOT, RDQUOT ];
        break;
        openQuotes = openQuotes || [ LDQUOT, LSQUOT ];
        closeQuotes = closeQuotes || [ RDQUOT, RSQUOT ];
        break;
      case 'fr':
        openQuotes = openQuotes || 
          [ LGUIL+NBSP, LDQUOT, LSQUOT, LDQUOT ];
        closeQuotes = closeQuotes || 
          [ NBSP+RGUIL, RDQUOT, RSQUOT, RDQUOT ];
        break;
      case 'fr-deepl':
      case 'pt-deepl':
      case 'en-deepl':
        openQuotes = openQuotes || [ LQ1, LQ2, LQ3, LQ4 ];
        closeQuotes = closeQuotes || [ RQ1, RQ2, RQ3, RQ4 ];
        break;
      default: {
        let emsg = `${msg} unsupported language:${lang}`;
        throw new Error(emsg);
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

    Object.assign(this, {
      closeQuotes,
      lang,
      level,
      openQuotes,
      rexQuotes,
      rexSplit,
      maxLevel,
      quotes,
    });
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

  static APOS() { return APOS; }
  static get LDQUOT() { return LDQUOT; }
  static get RDQUOT() { return RDQUOT; }
  static get LSQUOT() { return LSQUOT; }
  static get RSQUOT() { return RSQUOT; }
  static get LGUIL() { return LGUIL; }
  static get RGUIL() { return RGUIL; }
  static get NBSP() { return NBSP; }
  static get QUOTE() { return QUOTE; }
  static get LQ1() { return LQ1; }
  static get LQ2() { return LQ2; }
  static get LQ3() { return LQ3; }
  static get LQ4() { return LQ4; }
  static get RQ1() { return RQ1; }
  static get RQ2() { return RQ2; }
  static get RQ3() { return RQ3; }
  static get RQ4() { return RQ4; }

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
    const [ LQ1, LQ2, LQ3, LQ4 ] = this.openQuotes;
    const [ RQ1, RQ2, RQ3, RQ4 ] = this.closeQuotes;
    return [
      `what${RSQUOT}s the escape from that ${lang} feeling?${RQ2}`  
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

  scan(text, level=this.level) {
    const msg = 'QuoteParser.scan()';
    const dbg = DBG_QUOTE;
    const dbgv = DBG_VERBOSE && dbg;
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
    const dbg = DBG_QUOTE;
    let dState = this.scan(text, level);
    if (dbg) {
      console.log(msg, dState);
    }

    this.level = dState.level;
    this.quotes += dState.quotes;

    return dState;
  }

  convertQuotes(text, qpSwap, level=this.level) {
    const msg = 'QuoteParser.convertQuotes()';
    const dbg = 0 || DBG_VERBOSE;
    let { 
      openQuotes:srcOpen, 
      closeQuotes:srcClose, 
      rexSplit,
      maxLevel,
    } = this;
    if (qpSwap == null) {
      return text;
    }
    let {
      openQuotes:swapOpen,
      closeQuotes:swapClose,
    } = qpSwap;

    let dstParts = [];
    let srcParts = text.split(rexSplit);
    for (let i=0; i<srcParts.length; i++) {
      let part = srcParts[i];
      let srcOpenQuote = srcOpen[level];
      let srcCloseQuote = srcClose[level-1];

      if (i%2 === 0) {
        dbg && console.log(msg, `[1]text@${i}`, part);
      } else if (part === srcCloseQuote) {
        let nextPart = srcParts[i+1];
        if (srcCloseQuote===RSQUOT && /^\w/.test(nextPart)) {
          dbg && console.log(msg, `[2]apos@${i}`, {part, nextPart});
        } else {
          dbg && console.log(msg, `[3]close@${i}`, {part, nextPart});
          level--;
          part = swapClose[level];
          if (level < 0) {
            let emsg = `${msg} unmatched close quote: ${text}`;
            console.warn(msg, emsg);
            throw new Error(emsg);
          }
        }
      } else if (part === srcOpenQuote) {
        dbg && console.log(msg, `[4]open@${i}`, part);
        part = swapOpen[level];
        level++;
        if (maxLevel < level) {
          let emsg = `${msg} quote nesting exceeded: ${text}`;
          console.warn(msg, emsg);
          throw new Error(emsg);
        }
      } else {
        dbg && console.log(msg, `[5]skip@${i}`, level, 
          `"${part}"`, 
        );
        // not a quote
      }
      dstParts.push(part)
    }
    this.level = level;

    return dstParts.join('');
  }

  quotationLevel(text='') {
    const msg = 'QuoteParser.quotationLevel()';
    const dbg = 0 || DBG_VERBOSE;
    let { maxLevel, rexSplit, openQuotes, closeQuotes } = this;
    let parts = text.split(rexSplit);
    dbg && console.log(msg, '[1]parts', parts);
    if (parts.length === 1) {
      dbg && console.log(msg, '[2]no-quotes', parts);
      return 0;
    }
    for (let i=1; i<parts.length; i+=2) {
      let part = parts[i]; // parts with odd indices are quotes

      for (let j=0; j<maxLevel; j++) {
        if (part === openQuotes[j]) {
          dbg && console.log(msg, `[3]level${j} openQuotes`, part);
          return j;
        }
        if (part === closeQuotes[j]) {
          if (closeQuotes[j] === RSQUOT && /^\w/.test(parts[i+1])) {
            dbg && console.log(msg, `[4]apos`, part);
          } else {
            dbg && console.log(msg, `[5]level${j} closeQuotes`, part);
            return j+1;
          }
        }
      }
    }
    dbg && console.log(msg, '[4]no-match?', {part});
    return 0;
  }

}
