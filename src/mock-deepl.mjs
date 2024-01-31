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
        .replace(/\bUpaka/g, 'UPAKA')
        .replace(
      `I say, ‘You say, “I said UK!”?’.`,
      `Eu digo: "Está a dizer: "Eu disse Reino Unido!"?`)
        .replace(
      '<w><x>I say, <y>You say, <z>I said FR!</z>?</y>.</x></w>',
      `<w><x>Je dis, <y>Vous dites, <z>J'ai dit FR !</z>?.</y></x></w>`)
        .replace(
      '<w><x>I say, <y>You say, <z>I said PT!</z>?</y>.</x></w>',
      '<w><x>Eu digo, <y>Você diz, <z>Eu disse PT!</z>?</y></x></w>')
        .replace(
          '„Moench, du sammelst Almosen, bevor du isst;',
          '"Bhikkhu, você esmola comida antes de comer;')
        .replace(
          '“Mendicant, you seek alms before you eat;',
          '"Bhikkhu, você esmola comida antes de comer;')
        ;
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
