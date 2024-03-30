import {
  DBG,
  DBG_MOCK_API, 
} from './defines.mjs';

import { default as QuoteParser } from './quote-parser.mjs';

const { 
  LQ1, LQ2, LQ3, LQ4, 
  RQ1, RQ2, RQ3, RQ4,
  ELLIPSIS, ELL,
} = QuoteParser;

const lQuote = LQ1;
const rQuote = RQ1;

class MockGlossary {
  constructor(args) {
    const msg = 'MockGlossary.ctor()';
    const dbg = DBG.VERBOSE;
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
    const dbg = DBG.VERBOSE;
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
    const dbg = 0 || DBG.VERBOSE;
    dbg && console.log(msg, {sourceLang, targetLang}, texts);

    return texts.map(text=>{
    dbg && console.log(msg, "TEST", text);
      text = text && text.replace(
        `${LQ1}Bhikkhus, I do not see a single thing that is so `+
          'very blameworthy as wrong view.',
        `${LQ1}Bhikkhus, eu não vejo uma única coisa que seja `+
          'tão culpável como uma visão incorreta. '
      ).replace(/\baus Anteilnahme an. /g, 'por compaixão.')
      .replace(/\bBei welchen drei\? /g, 'Quais são os três? ')
      .replace(/\bDas ist ein Moench, /g, 'Este é um bhikkhu ')
      .replace(/\bman einen Moench, /g, 'chama um bhikkhu ')
      .replace(/, Moenche, /, 'bhikkhus,')
      .replace(/\bthe dart of craving/g, 'o dardo do anseio')
      .replace(/\bUpaka/g, 'UPAKA')
      .replace(
        `I say, ‘You say, “I said UK!”?’.`,
        `Eu digo: "Está a dizer: "Eu disse Reino Unido!"?`
      ).replace(
        `${LQ1}${LQ2}I say, ${LQ3}You say, ${LQ4}I said PT!${RQ4}?${RQ3}.${RQ2}${RQ1}`,
        `${LQ1}${LQ2}Eu digo, ${LQ3}Você diz, ${LQ4}Eu disse PT!${RQ4}?${RQ3}.${RQ2}${RQ1}`,
      ).replace(
        `Der Pfeil des Verlangens`,
        'O dardo do anseio')
      .replace(
        '„Moench, du sammelst Almosen, bevor du isst;',
        '"Bhikkhu, você esmola comida antes de comer;'
      ).replace(
        '“Bhikkhu, you seek alms before you eat;',
        '"Bhikkhu, você procura esmola comida antes de comer;'
      //).replace(
        //`${LQ1}${LQ2}I say, ${LQ3}You say, ${LQ4}I said FR!${RQ4}?${RQ3}.${RQ2}${RQ1}`,
        //`${LQ1}${LQ2}Je dis, ${LQ3}Vous dites, ${LQ4}Je dis FR!${RQ4}?${RQ3}.${RQ2}${RQ1}`
      ).replace(
        `${LQ2}I say, ${LQ3}You say, ${LQ4}I said FR!${RQ4}?${RQ3}.${RQ2}${RQ1}`,
        `${LQ2}Je dis, ${LQ3}Vous dites, ${LQ4}Je dis FR!${RQ4}?${RQ3}.${RQ2}${RQ1}.`
      ).replace(
        `${LQ2}I say, ${LQ3}You say, ${LQ4}I said PT!${RQ4}?${RQ3}.${RQ2}${RQ1}`,
        `${LQ2}Eu digo, ${LQ3}Você diz, ${LQ4}Eu disse PT!${RQ4}?${RQ3}.${RQ2}${RQ1}`,
      ).replace(
        `${LQ2}I say, ${LQ3}You say, ${LQ4}I said PT!${RQ4}?${RQ3}.${RQ2}${RQ1}`,
        `${LQ2}Eu digo, ${LQ3}Você diz, ${LQ4}Eu disse PT!${RQ4}?${RQ3}.${RQ2}${RQ1}`,
      ).replace(
        qp_fr_deepl.testcaseFeelingsEN('French'),
        'comment échapper à ce sentiment français ? '
      ).replace(
        qp_fr_deepl.testcaseRebirthEN('FR'),
          `${LQ2} Je comprends : ${LQ3}La renaissance est terminée `+
            `en FR${RQ3}${RQ2}?${RQ1}.`
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
      ).replace(
        'are these things skillful or unskillful?',
        'estas coisas são hábeis ou inábeis? '
      ).replace(
        'succeed in the system of skillful teaching.',
        'tenha sucesso no sistema de ensino hábil. '
      ).replace(
        'so the skillful person ',
        'por isso, a pessoa hábil '
      ).replace(
        'They are entirely a heap of the skillful. "',
        'São inteiramente um amontoado de hábeis. " '
      ).replace(
        'He gives up the unskillful and develops the skillful.',
        'Abandona o inábil e desenvolve o hábil. '
      ).replace(
        'Whatever qualities are skillful, part of the skillful, all are rooted.',
        'Quaisquer que sejam as qualidades hábeis, parte do hábil, todas estão enraizadas. '
      ).replace(
        'One who desires merit, grounded in the skillful, ',
        'Aquele que deseja o mérito, baseado no hábil, '
      ).replace(
        'There Sāriputta addressed the mendicants',
        'Aí, Sāriputta dirigiu-se aos mendicantes ',
      ).replace(
        'There the Blessed One is now staying',
        'Lá o Abençoado está agora a ficar ',
      ).replace(
        'There is, brahmin.',
        'Há, brâmane. '
      ).replace(
        '2. endeavor',
        '2. esforzarse ',
      ).replace(
        '2. Endeavor',
        '2. Endeavor ', // WHY!?
      ).replace(
        '2. padhānasutta', 
        '2. padhānasutta ', 
      ).replace(
        '2. Padhānasutta', 
        '2. Padhānasutta ', 
      ).replace(
        QuoteParser.testcaseThinking_EN("SPAN"), [
          `Pensando, `,
          `${LQ1}He hecho cosas SPAN por medio `,
          `del cuerpo, la palabra y la mente${RQ1}, `,
          `se mortifican.`,
        ].join('')
      ).replace(
        'springtime',
        'Primavera',
      ).replace(
        QuoteParser.testcaseEllipsisEN("PT", {
          prefix: 'They understand: ',
          lQuote,
          rQuote,
          ellipsis:ELL
        }),
        `Eles compreendem: ${LQ1}Isto é PT${RQ1}<ell/>${LQ1}Isto é sofrimento${RQ1}<ell/>${LQ1}Isto é a origem${RQ1}.`
      ).replace(
        QuoteParser.testcaseEllipsisEN("ES", {
          lQuote,
          rQuote,
          ellipsis:ELL
        }),[
          `Comprenden: `, `${LQ1}Esto es ES${RQ1}`, 
          ELL, `${LQ1}Esto es sufrimiento${RQ1}`, 
          ELL, `${LQ1}Este es el origen${RQ1}`, 
          `.`,
        ].join('')
      ).replace(
        "And what are dark and bright deeds?",
        'E o que são actos sombrios e luminosos?',
      ).replace(
        "On the side of dark and bright",
        'Do lado do sombrio e do luminoso',
      ).replace(
        'That is why I sleep at ease. ',
        `É por isso que durmo tranquilo. `,
      ).replace(
        QuoteParser.testcaseQuotesEN({lang:'mind/PT', lQuote}),
        `${LQ1}Ouça e aplique bem a sua mente/PT, eu falarei.`,
      ).replace(
        QuoteParser.testcaseQuotesEN({lang:'mind/PT', rQuote}),
        `Ouça e aplique bem a sua mente/PT, eu falarei.${RQ1}`,
      ).replace(
        QuoteParser.testcaseQuotesEN({lang:'mind/PT', lQuote, rQuote}),
        `${LQ1}Ouça e aplique bem a sua mente/PT, eu falarei.${RQ1}`,
      ).replace(
        QuoteParser.testcaseMisterEN({
          lang: 'messenger/PT',
          lQuote:QuoteParser.LQ3,
          rQuote:QuoteParser.RQ3,
        }),
        `‘Senhor, vocíª ní£o viu o primeiro mensageiro/PT dos devas que apareceu entre os seres humanos?’ `,
      ).replace(
        QuoteParser.testcaseDonationEN({
          lang: 'religious/PT',
          rQuote:QuoteParser.RQ1,
        }),
        `Estes são dois tipos de pessoas no mundo que são dignas de um donativo religioso/PT, e é aí que deve dar um presente.${RQ1} `
      );
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
