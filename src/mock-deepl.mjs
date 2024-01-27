import {
  DBG_MOCK_API, DBG_VERBOSE,
} from './defines.mjs';

class MockGlossary {
  constructor(args) {
    const msg = 'MockGlossary.ctor()';
    const dbg = DBG_VERBOSE;
    let [
      name,
      sourceLang,
      targetLang,
      glossaryEntries,
    ] = args;
    targetLang = targetLang.replace(/-[a-z]+/i, '');
    Object.assign(this, {
      name,
      ready: true,
      sourceLang,
      targetLang,
      glossaryEntries,
    });
    dbg && console.log(msg, this);
  }
}

class MockTranslator {
  constructor(authKey) {
    const msg = 'MockTranslator.ctor()';
    const dbg = DBG_VERBOSE;
    dbg && console.log(msg, `authKey: ${authKey.substring(0,4)}...`);
  }

  async listGlossaries() {
    return [];
  }

  async createGlossary(...args) {
    return new MockGlossary(args);
  }

  async translateText(texts, sourceLang, targetLang, translateOpts) {
    const msg = "MockTranslator.translateText()";
    const dbg = DBG_VERBOSE;
    dbg && console.log(msg, {sourceLang, targetLang});
    return texts.map(text=>{
      text = text
        .replace(/\baus Anteilnahme an. /g, 'por compaixão.')
        .replace(/\bBei welchen drei\? /g, 'Quais são os três? ')
        .replace(/\bDas ist ein Moench, /g, 'Este é um bhikkhu ')
        .replace(/\bman einen Moench, /g, 'chama um bhikkhu ')
        .replace(/, Moenche, /, 'bhikkhus,')
        .replace(/\bthe dart of craving/g, 'o dardo do anseio')
        .replace(/\bDer Pfeil des Verlangens/g, 'O dardo do anseio')
        .replace(/\bUpaka/g, 'UPAKA')
        ;
      switch (text) {
        case '„Moench, du sammelst Almosen, bevor du isst;':
        case '“Mendicant, you seek alms before you eat;':
          text = '"Bhikkhu, você esmola comida antes de comer;';
          break;
      }
      return {
        text,
      }
    });
  }
}

export default class MockDeepL {
  static get Translator() {
    return MockTranslator;
  }
}
