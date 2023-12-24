import { default as DeepL } from "./deepl.mjs"
import pkg from "scv-bilara";
const { 
  BilaraData, 
  Seeker,
} = pkg;

import {
  DBG_CREATE,
} from './defines.mjs'

var creating = false;

const DST_LANG = 'pt-PT';
const SRC_LANG = 'de';
const SRC_AUTHOR = 'sabbamitta';
const DST_AUTHOR = 'edited-ml';

export default class SuttaTranslator {
  constructor(opts={}) {
    const msg = 'SuttaTranslator.ctor()';

    if (!creating) {
      throw new Error(`${msg} use SuttaTranslator.create()`);
    }

    Object.assign(this, opts);
  }

  static async create(opts={}) {
    const msg = 'SuttaTranslator.create()';
    const dbg = DBG_CREATE;
    let {
      dstLang=DST_LANG,
      srcLang=SRC_LANG,
      srcAuthor = SRC_AUTHOR,
      dstAuthor=DST_AUTHOR,
      translator,
      bilaraData = new BilaraData(),
    } = opts;

    if (translator == null) {
      translator = await DeepL.create({ 
        srcLang, dstLang, dstAuthor, srcAuthor,
      });
    }

    let seeker = await new Seeker({ bilaraData, logger: bilaraData, })
      .initialize();

    let st;
    try {
      creating = true;
      st = new SuttaTranslator({
        translator,
        dstLang,
        srcLang,
        dstAuthor,
        srcAuthor,
        bilaraData,
        seeker,
      });
    } finally {
      creating = false;
    }

    return st;
  }

}
