import {
  DBG_MOCK_API, DBG_VERBOSE,
} from './defines.mjs';

import { default as QuoteParser } from './quote-parser.mjs';

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

const qp_en_deepl = new QuoteParser({lang:'en-deepl'});
const qp_fr_deepl = new QuoteParser({lang:'fr-deepl'});

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
    const dbg = 0 || DBG_VERBOSE;
    dbg && console.log(msg, {sourceLang, targetLang}, texts);

    return texts.map(text=>{
      text = text
      .replace(
        '<w>Bhikkhus, I do not see a single thing that is so '+
          'very blameworthy as wrong view.',
        '<w>Bhikkhus, eu não vejo uma única coisa que seja '+
          'tão censurável como uma visão incorreta. '
      ).replace(/\baus Anteilnahme an. /g, 'por compaixão.')
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
        `Der Pfeil des Verlangens`,
        'O dardo do anseio')
      .replace(
        '„Moench, du sammelst Almosen, bevor du isst;',
        '"Bhikkhu, você esmola comida antes de comer;')
      .replace(
        '“Bhikkhu, you seek alms before you eat;',
        '"Bhikkhu, você esmola comida antes de comer;')
      .replace(
        '<x>I say, <y>You say, <z>I said FR!</z>?</y>.</x></w>',
        `<x>Je dis, <y>Vous dites, <z>J'ai dit FR !</z>?.</y></x></w>`)
      .replace(
        '<x>I say, <y>You say, <z>I said PT!</z>?</y>.</x></w>',
        '<x>Eu digo, <y>Você diz, <z>Eu disse PT!</z>?</y></x></w>'
      ).replace(
        qp_fr_deepl.testcaseFeelingsEN('French'),
        'Comment échapper à ce sentiment d’appartenance à la France ? › '
      ).replace(
        qp_fr_deepl.testcaseRebirthEN('FR'),
          '<x>Je comprends : <y>La renaissance est terminée '+
            'en FR</y></x>?</w>'
      ).replace(
        qp_fr_deepl.testcasePleasuresEN('French'),
          'comprendre la gratification, l\'inconvénient et '+
            'la fuite des plaisirs français'
      ).replace(
        "craving aggregates' origin",
        'l\'origine des agrégats de l\'envie'
      ).replace(
        "The French child's toy",
        "Le jouet de l\'enfant français",
      ).replace(
        "Springtime",
        'Primavera'
      ).replace(
        '“Bhikkhu, that is incorrect view;',
        '"Bhikkhu, essa visão é incorrecta;'
      )
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
