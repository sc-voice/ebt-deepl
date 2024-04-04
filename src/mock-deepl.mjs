import {
  DBG,
  DBG_MOCK_API, 
} from './defines.mjs';

import { default as QuoteParser } from './quote-parser.mjs';

const { 
  LQ1, LQ2, LQ3, LQ4, 
  RQ1, RQ2, RQ3, RQ4,
  ELLIPSIS, ELL, APOS,
  LDQUOT, RDQUOT, LSQUOT, RSQUOT,
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

function compare(a,b) {
  const msg = "MockDeepL.compare()";
  let len = Math.max(a.length, b.length);
  let ok = true;
  for (let i = 0; i < len; i++) {
    let ai = a.charAt(i);
    let bi = b.charAt(i);
    if (ai !== bi) {
      ok = false;
      console.log(msg, {i, ai, bi});
    }
  }
  return ok;
}

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
    const dbg = DBG.MOCK_XLT;
    const dbgv = dbg && DBG.VERBOSE;

    return texts.map(text=>{
      dbg && console.log(msg, `"${text}"`);
      
      if (0) { // use this to debug
        let opts={
          lQuote1: LQ3,
          rQuote1: RQ3,
          rQuote2: RQ2,
          lang: 'PT sickness',
          apos: APOS,
        }
        let expected = QuoteParser.testcaseSickEN(opts);
        console.log(msg, {text, expected});
        if (compare(text, expected)) {
          dbg && console.log(msg, '[1]compare-ok');
        } else {
          dbg && console.log(msg, '[2]COMPARE?');
        }
      }

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
        'There Sāriputta addressed the bhikkhus',
        'Aí Sāriputta dirigiu-se aos monges ',
      ).replace(
        'There the Blessed One is now staying',
        'Lá o Abençoado está agora a ficar ',
      ).replace(
        'There exists, brahmin.',
        'Existe, brâmane. '
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
        QuoteParser.testcaseDonationEN({
          lang: 'religious-PT',
          rQuote:QuoteParser.RQ1,
          people:'people',
        }),
        `Estas são duas pessoas no mundo que são dignas de um donativo religioso-PT, e é aí que deve dar um presente.${RQ1} `
      ).replace(
        QuoteParser.testcaseMisterEN({
          lang: 'messenger/PT',
          lQuote:QuoteParser.LQ3,
          rQuote:QuoteParser.RQ3,
          gods: 'DEVA1s',
        }),
        `‘Senhor, você não viu o primeiro mensageiro/PT dos devas que apareceu entre os seres humanos?’ `,
      ).replace(
        `These are two people in the world who are worthy of a religious-PT donation.${RQ1}`,
        `Estas são duas pessoas no mundo que são dignas de um donativo religioso-PT.${RQ1}`,
      ).replace(
        QuoteParser.testcaseMisterEN({
          lang: 'messenger/PT',
          lQuote:QuoteParser.LQ2,
          rQuote:QuoteParser.RQ2,
          gods: 'DEVA1s',
        }),
      `${LQ2}Senhor, não viu o primeiro mensageiro/PT dos DEVA1s que apareceu entre os seres humanos?${RQ2}`,
      ).replace(
        QuoteParser.testcaseElderlyEN({ 
          lQuote:LQ2, rQuote:RQ2, lang:' PT' }),
        LQ2+
        `Senhor PT, não viu entre os seres humanos `+
        `uma mulher ou um homem idoso - com oitenta, `+
        `noventa ou cem anos - dobrado, torto, apoiado `+
        `num bordão, a tremer ao andar, doente, fora de moda, `+
        `com os dentes partidos, o cabelo grisalho e escasso `+
        `ou calvo, a pele enrugada e os membros manchados?`+
        RQ2,
      ).replace(
        QuoteParser.testcaseSickEN({ 
          lQuote1: LQ3,
          rQuote1: RQ3,
          rQuote2: RQ2,
          lang: 'PT sickness',
          apos: APOS,
        }),
        LQ3+
        'Eu também estou sujeito a ficar doente. '+
        'Não estou isento da doença de PT. É melhor fazer o '+
        'bem através do corpo, da fala e da mente'+
        RQ3+
        '?'+
        RQ2
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
