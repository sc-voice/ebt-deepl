import fs from "fs";
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
const RE_POST_APOS = /^\w/;

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
      case 'nl':
        openQuotes = openQuotes || [ LDQUOT, LDQUOT,LDQUOT,  LDQUOT, ];
        closeQuotes = closeQuotes || [ RDQUOT, RDQUOT,RDQUOT,  RDQUOT, ];
        break;
      case 'es':
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
      default: {
        if (lang.endsWith('-deepl')) {
          openQuotes = openQuotes || [ LQ1, LQ2, LQ3, LQ4 ];
          closeQuotes = closeQuotes || [ RQ1, RQ2, RQ3, RQ4 ];
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

  // ...APOS...
  testcaseGratificationEN(lang) {
    const [ LQ1, LQ2, LQ3, LQ4 ] = this.openQuotes;
    const [ RQ1, RQ2, RQ3, RQ4 ] = this.closeQuotes;

    return `‘But reverends, what’s the gratification, `+
      `the drawback, and the escape when it comes to ${lang}`;
  }

  // ...APOS...
  testcasePleasuresEN(lang) {
    const [ LQ1, LQ2, LQ3, LQ4 ] = this.openQuotes;
    const [ RQ1, RQ2, RQ3, RQ4 ] = this.closeQuotes;

    return `understand ${lang} pleasures’ `+
      `gratification, drawback, and escape`;
  }

  // ...APOS...RQ1 RQ2
  testcaseSquirrelsEN(lang) {
    const [ LQ1, LQ2, LQ3, LQ4 ] = this.openQuotes;
    const [ RQ1, RQ2, RQ3, RQ4 ] = this.closeQuotes;

    return `the ${lang} squirrels’ feeding ground${RQ2}${RQ1}`;
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
    const dbg = 0 || DBG_VERBOSE;
    let { 
      openQuotes:srcOpen, 
      closeQuotes:srcClose, 
      rexSplit,
      maxLevel,
    } = this;
    if (qpSwap == null || text=='') {
      return text;
    }
    let {
      openQuotes:swapOpen,
      closeQuotes:swapClose,
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
          let context = [parts[i-1], part, parts[i+1]];
          if (this.isApostrophe(context)) {
            dbg && console.log(msg, `[4]apos`, context);
          } else {
            dbg && console.log(msg, `[5]level${j} closeQuotes`, context);
            return j+1;
          }
        }
      }
      dbg && console.log(msg, '[4]no-match?', {part});
    }
    return 0;
  }

}
