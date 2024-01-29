const QUOTE  = '“'; // Quotation mark
const APQUOT = "'"; // Apostrophe/single-quote
const LSQUOT = '‘'; // Left single quote
const RSQUOT = '’'; // Right single quote, curly apostrophe
const LGUIL  = '«'; // Left guillemet
const RGUIL  = '»'; // Right guillemet
const NBSP   = '\u00a0'; // non-breaking space
const LDQUOT = '“'; // Left double quote
const RDQUOT = '”'; // Right double quote

import {
  DBG_QUOTE, DBG_VERBOSE,
} from './defines.mjs';

export default class QuoteParser {
  constructor(opts={}) {
    const msg = 'QuoteParser.ctor()';
    const dbg = DBG_QUOTE;
    let {
      lang = 'en',
      openQuotes = [],
      closeQuotes = [],
      level = 0,
      maxLevel = 4,
      dLevel = 0,
    } = opts;

    lang = lang.toLowerCase();

    switch (lang) {
      case 'en':
        openQuotes = [ LDQUOT, LSQUOT ];
        closeQuotes = [ RDQUOT, RSQUOT ];
        break;
      case 'pt':
      case 'pt-pt':
        openQuotes = [ LGUIL, LDQUOT, LSQUOT ];
        closeQuotes = [ RGUIL, RDQUOT, RSQUOT ];
        break;
      case 'pt-br':
        openQuotes = [ LDQUOT, LSQUOT ];
        closeQuotes = [ RDQUOT, RSQUOT ];
        break;
      case 'fr':
        openQuotes = [ LGUIL+NBSP, LDQUOT, LSQUOT ];
        closeQuotes = [ NBSP+RGUIL, RDQUOT, RSQUOT ];
        break;
      case 'deepl':
        openQuotes = [ '"', "'" ];
        closeQuotes = [ '"', "'" ];
        break;
      default: {
        let emsg = `${msg} unsupported language:${lang}`;
        throw new Error(emsg);
      } break;
    }
    
    let allQuotes = [...openQuotes, ...closeQuotes ];
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
      maxLevel,
    });
  }

  static get LDQUOT() { return LDQUOT; }
  static get RDQUOT() { return RDQUOT; }
  static get LSQUOT() { return LSQUOT; }
  static get RSQUOT() { return RSQUOT; }
  static get LGUIL() { return LGUIL; }
  static get RGUIL() { return RGUIL; }
  static get NBSP() { return NBSP; }
  static get QUOTE() { return QUOTE; }
  static APQUOTNBSP() { return APQUOT; }

  parse(text) {
    const msg = 'QuoteParser.parse()';
    const dbg = DBG_QUOTE;
    const dbgv = DBG_VERBOSE && dbg;
    let { 
      rexQuotes, level, openQuotes, closeQuotes, maxLevel,
    } = this;
    let execRes;
    while ((execRes=rexQuotes.exec(text)) !== null) {
      let match = execRes[0];
      dbgv && console.log(msg, match);
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

    let dLevel = level - this.level;
    if (dbg) {
      if (dLevel === 0) {
        console.log(msg, `level:${level}`);
      } else if (dLevel < 0) {
        console.log(msg, `level:${level} (${dLevel})`);
      } else {
        console.log(msg, `level:${level} (+${dLevel})`);
      }
    }
    this.level = level;
    this.dLevel = dLevel;
    return this;
  }

}
