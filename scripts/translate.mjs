#!/usr/bin/env node
import fs from "fs";
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { logger } from 'log-instance';
logger.logLevel = 'warn';
import { BilaraData } from 'scv-bilara'
import { default as SuttaTranslator } from "../src/sutta-translator.mjs"
import pkgScvEsm  from "scv-esm";
const { SuttaRef, AuthorsV2 } = pkgScvEsm;
const cwd = process.cwd();

const EBT_DEEPL = 'ebt-deepl';

let out = "all";
let suid;
let srcLang1 = 'en';
let srcAuthor1;
let srcLang2;
let srcAuthor2;
let updateGlossary = false;
let dstLang = 'pt';
let dstAuthor = EBT_DEEPL;
let dstReplace = false;
let refLang;
let refAuthor;
let [nodePath, scriptPath, ...args] = process.argv;
let category = 'sutta';
let listGlossary1 = false;

// For SC-Voice.net
let ebtData = await new BilaraData({
  name:'ebt-data',
}).initialize();

// For bilara-data pre-translation pull requests
let bdDeepL = await new BilaraData({
  name: 'bilara-data-deepl',
  branch: 'unpublished'
}).initialize();

function help() {
  console.log(`
NAME
    translate - translate ebt-data sutta

SYNOPSIS
    translate [OPTIONS] sutta_uid

DESCRIPTION
    Translate sutta from source language (srcLang) to destination
    language (dstLang). EBT-DeepL translates from two sources 
    having consistent and extensive Pali EBT coverage.
    The first source by default is Bhante Sujato's EN translations.
    The second source by default is Ayya Sabbamitta's DE translations.
    DeepL translations will be provided for both translation sources.
    Ideally, one should also designate a reference based on
    consistent, segmented EBT source authored in Bilara.
    For example, the default reference for PT is laera-quaresma 
    and the default reference for FR is noeismet.
    References are not translated by DeepL--they are simply shown
    in the output to aid in verification.
    The Pali MS segmented text is also shown in the output
    for an absolute reference of comparison.
    If the sutta_uid includes a segment number (e.g., "an3.49:1.1"),
    only that segment is translated.

    -da, --dst-author
        Destination author. Default is 'ebt-deepl'

    -dl, --dst-lang
        Destination language. Default is 'pt'.

    -dr, --dst-replace
        Replace existing destination file. Default is false.

    -lg1, --list-glossary1
        List glossary entries for first translation source.

    -oa, --out-all
        Output Pali, source1, source2, reference, translation1,
        translation2 texts. This is the default

    -ob1, --out-bilara-data-deepl1
        Output JSON translation from source1 to local/bilara-data-deepl
        using ebt-deepl author.

    -ob2, --out-bilara-data-deepl2
        Output JSON translation from source2 to local/bilara-data-deepl
        using ebt-deepl author.

    -ocqb, --out-curly-quotes-bilara-data
        Skip translation and only change straight quotes to curly 
        quotes in destination file. Source files are ignored. 
        Curly quotes are normally emitted during translation, 
        so this option is rarely needed.

    -ocqe, --out-curly-quotes-ebt-data
        Skip translation and only change straight quotes to curly 
        quotes in destination file. Source files are ignored. 
        Curly quotes are normally emitted during translation, 
        so this option is rarely needed.

    -oe1, --out-ebt-data1
        Output JSON translation from source1 to local/ebt-data
        using ebt-deepl author.

    -oe2, --out-ebt-data2
        Output JSON translation from source2 to local/ebt-data
        using ebt-deepl author.

    -oj1, --out-json1
        Output JSON to stdout from source 1

    -oj2, --out-json2
        Output JSON to stdout from source 2

    -ra, --ref-author
        Reference author. Default is determined from reference language.

    -rl, --ref-lang
        Reference language. Default is destination language.

    -sa1, --src-author1
        Source author #1. Default is determined from source language.

    -sa2, --src-author2
        Source author #2. Default is determined from source language.

    -sl1, --src-lang1
        Source language #1. Default is 'de'.

    -sl2, --src-lang2
        Source language #2. Default is 'en'.

    -ug, --update-glossary
        Update glossary file(s) before translating
`);
  process.exit(0);
}

if (args.length < 1) {
  help();
}
for (var i = 0; i < args.length; i++) {
  var arg = args[i];

  if (arg === '-?' || arg === '--help') {
    help();
  } else if (arg === '-dl' || arg === '--dst-lang') {
    dstLang = args[++i];
  } else if (arg === '-da' || arg === '--dst-author') {
    dstAuthor = args[++i];
  } else if (arg === '-dr' || arg === '--dst-replace') {
    dstReplace = true;
  } else if (arg === '-lg1' || arg === '--list-glossary1') {
    listGlossary1 = true;
  } else if (arg === '-sl1' || arg === '--src-lang1') {
    srcLang1 = args[++i];
  } else if (arg === '-sl2' || arg === '--src-lang2') {
    srcLang2 = args[++i];
  } else if (arg === '-sa1' || arg === '--src-author1') {
    srcAuthor1 = args[++i];
  } else if (arg === '-sa2' || arg === '--src-author2') {
    srcAuthor2 = args[++i];
  } else if (arg === '-rl' || arg === '--ref-lang') {
    refLang = args[++i];
  } else if (arg === '-ra' || arg === '--ref-author') {
    refAuthor = args[++i];
  } else if (arg === '-oa' || arg === '--out-all') {
    out = 'all';
  } else if (arg === '-oj1' || arg === '--out-json1') {
    out = 'oj1';
  } else if (arg === '-oj2' || arg === '--out-json2') {
    out = 'oj2';
  } else if (arg === '-ob1' || arg === '--out-bilara-data-deepl1') {
    out = 'ob1';
  } else if (arg === '-ob2' || arg === '--out-bilara-data-deepl2') {
    out = 'ob2';
  } else if (arg==='-ocqb' || arg==='--out-curly-quotes-bilara-data') {
    out = 'ocqb';
  } else if (arg==='-ocqe' || arg==='--out-curly-quotes-ebt-data') {
    out = 'ocqe';
  } else if (arg === '-oe1' || arg === '--out-ebt-data1') {
    out = 'oe1';
  } else if (arg === '-oe2' || arg === '--out-ebt-data2') {
    out = 'oe2';
  } else if (arg === '-ug' || arg === '--update-glossary') {
    updateGlossary = true;
  } else if (arg.startsWith('-')) {
    console.warn(`Invalid argument: "${arg}". Try:`);
    console.warn('  scripts/translate.mjs --help');
    process.exit(-1);
  } else {
    suid = args[i];
  }
}

srcAuthor1 = srcAuthor1 || AuthorsV2.langAuthor(srcLang1);
srcAuthor2 = srcAuthor2 || srcLang2 && AuthorsV2.langAuthor(srcLang2);
refLang = refLang || dstLang;
refAuthor = refAuthor || AuthorsV2.langAuthor(refLang);

let xlts = [
  await SuttaTranslator.create({
    srcLang: srcLang1, 
    srcAuthor: srcAuthor1,
    dstLang,
    dstAuthor,
    bilaraData: ebtData,
    updateGlossary,
  }),
];
if (srcAuthor2) {
  xlts.push(
    await SuttaTranslator.create({
      srcLang: srcLang2, 
      srcAuthor: srcAuthor2,
      dstLang,
      dstAuthor,
      bilaraData: ebtData,
      updateGlossary,
    })
  )
}

async function listGlossaryEntries(xlt) {
  let { xltDeepL } = xlt;
  let { glossaryName, glossary, translator } = xltDeepL;
  let { glossaryId, entryCount } = glossary;
  console.warn('name:', glossaryName, `[${entryCount} entries]`);
  console.warn('id  :', glossaryId);
  let entries = await translator.getGlossaryEntries(glossaryId);
  let { implEntries } = entries;
  let keys = Object.keys(implEntries);
  keys.forEach(key=>{
    let value = implEntries[key];
    console.log(`${key} | ${value}`);
  });
  process.exit(0);
}

if (listGlossary1) {
  listGlossaryEntries(xlts[0]);
}

if (suid == null) {
  if (updateGlossary) {
    console.log("Glossary uploaded");
    process.exit(0);
  }
  console.log("No sutta_uid specified");
  process.exit(-1);
}

let sref = SuttaRef.create(suid);
if (sref == null) {
  throw new Error(`Invalid SuttaRef ${suid}`);
}
let { sutta_uid, lang, author, segnum, scid } = sref;

let srcRef1 = {sutta_uid, lang:srcLang1, author:srcAuthor1}
let srcRef2 = srcAuthor2 && {sutta_uid, lang:srcLang2, author:srcAuthor2}
let refRef = {sutta_uid, lang:dstLang, author:refAuthor}
let pliRef = {sutta_uid, lang:'pli', author: 'ms'}
let { segments: pliSegs, } = await xlts[0].loadSutta(pliRef);
let xltOpts = {bilaraData: ebtData}
let { segments: refSegs } = 
  await SuttaTranslator.loadSutta(refRef, xltOpts);
let { segments: srcSegs1 } = 
  await SuttaTranslator.loadSutta(srcRef1, xltOpts);
if (srcRef2) {
  var { segments: srcSegs2 } = srcRef2 && 
    await SuttaTranslator.loadSutta(srcRef2, xltOpts);
}

let xltsOut = [];
for (let i=0; i<xlts.length; i++) {
  switch (out) {
    case 'ocqb':
    case 'ocqe':
      break;
    default: 
      let xlt = xlts[i];
      xltsOut[i] = await xlt.translate(suid);
      break;
  }
}

let scids = Object.keys(pliSegs);
if (segnum) {
  scids = scids.filter(s => s===scid);
}

function outAll() {
  console.log(`Sutta    : ${sutta_uid}`);
  console.log(`Source1  : ${srcLang1}/${srcAuthor1}`);
  srcAuthor2 && console.log(`Source2  : ${srcLang2}/${srcAuthor2}`);
  console.log(`Reference: ${refLang}/${refAuthor}`);
  console.log(`Target   : ${dstLang}/${dstAuthor}`);

  let scSegs = xltsOut.map(x=>
    SuttaTranslator.curlyQuoteSegments(x.dstSegs));

  for (let i=0; i<scids.length; i++) {
    let si = scids[i];

    console.log('-----', si, '-----');
    console.log(`pli:\t`, pliSegs[si]);
    console.log(`${srcLang1}:\t`, srcSegs1[si]);
    srcAuthor2 && console.log(`${srcLang2}:\t`, srcSegs2[si]);
    console.log(`ref:\t`, refSegs && refSegs[si]);
    console.log(`${srcLang1}-${dstLang}:\t`, scSegs[0][si]);
    srcAuthor2 && console.log(`${srcLang2}-${dstLang}:\t`, 
      scSegs[1][si]);
  }
}

function outJson(xltOut) {
  let { dstSegs } = xltOut;
  let scSegs = SuttaTranslator.curlyQuoteSegments(dstSegs);
  if (segnum) {
    console.log({
      [scid]: scSegs[scid],
    });
  } else {
    console.log(JSON.stringify(scSegs, null, 2));
  }
}

async function outBilaraData(xltOut, bd) {
  const msg = 'translate.outBilaraData()';
  const dbg = 1;
  const { name } = bd;
  let outDir = path.join(__dirname, 
    `../local/${name}/translation`,
    dstLang,
    EBT_DEEPL,
    category,
    );
  let pliPath  = bd.docPaths(sref)[0];
  let dstPath = pliPath
    .replace('root/pli/ms', 
      ['translation', dstLang, dstAuthor].join('/'))
    .replace('root-pli-ms',
      ['translation', dstLang, dstAuthor].join('-'));
  let dstDir = path.dirname(dstPath);
  let dstBase = path.basename(dstPath);

  dbg && console.warn(msg, 'mkdir:', dstDir.replace(cwd,'').substring(1));
  await fs.promises.mkdir(dstDir, { recursive: true })
  let dstSegs;
  if (segnum) {
    try {
      dstSegs = JSON.parse(await fs.promises.readFile(dstPath));
    } catch(e) {
      console.warn(msg, 'Cannot update non-existent translation:\n  ', 
        dstBase);
      let json = JSON.stringify(xltOut.dstSegs, null, 2);
      console.log(json);
      process.exit(-1);
    }

    dstSegs[scid] = xltOut.dstSegs[scid];
  } else {
    dstSegs = xltOut.dstSegs;
  }
  let scSegs = SuttaTranslator.curlyQuoteSegments(dstSegs);
  let json = JSON.stringify(scSegs, null, 2);

  let dstExists;
  try {
    let res = await fs.promises.stat(dstPath);
    dstExists = true;
  } catch(e) { // file does not exist
    dstExists = false;
  }
  if (dstExists) {
    if (!dstReplace) {
      console.log(msg, json);
      console.warn(msg, 'CANCELLED (file exists)', dstBase);
      console.warn(msg, 'override with "--dst-replace"');
      return;
    }
    dbg && console.warn(msg, 'overwriting:', dstBase, `${json.length}B`);
  } else {
    dbg && console.warn(msg, 'writing:', dstBase, `${json.length}B`);
  }

  dbg && console.warn(msg, json);

  await fs.promises.writeFile(dstPath, json);
  dbg && console.warn(msg, `translated ${dstBase}`);
}

async function outCurlyQuotes(bd) {
  const msg = 'translate.outCurlyQuotes()';
  const dbg = 0;
  const { name } = bd;
  let outDir = path.join(__dirname, 
    `../local/${name}/translation`,
    dstLang,
    EBT_DEEPL,
    category,
    );
  let pliPath  = bd.docPaths(sref)[0];
  let dstPath = pliPath
    .replace('root/pli/ms', 
      ['translation', dstLang, dstAuthor].join('/'))
    .replace('root-pli-ms',
      ['translation', dstLang, dstAuthor].join('-'));
  let dstDir = path.dirname(dstPath);
  let dstBase = path.basename(dstPath);

  let dstSegs;
  try {
    dstSegs = JSON.parse(await fs.promises.readFile(dstPath));
  } catch(e) {
    console.warn(msg, 'file not found', dstBase);
    process.exit(-1);
  }

  let scSegs = SuttaTranslator.curlyQuoteSegments(dstSegs);
  let json = JSON.stringify(scSegs, null, 2);
  dbg && console.warn(msg, json);

  await fs.promises.writeFile(dstPath, json);
}

if (!dstAuthor) {
  throw new Error(`${out} required dstAuthor`);
}

switch (out) {
  case 'all': 
    outAll();
    break;
  case 'ob1':
    outBilaraData(xltsOut[0], bdDeepL);
    break;
  case 'ob2':
    if (!srcAuthor2) {
      throw new Error(`${out} requires srcAuthor2`);
    }
    outBilaraData(xltsOut[1], bdDeepL);
    break;
  case 'oe1':
    outBilaraData(xltsOut[0], ebtData);
    break;
  case 'oe2':
    if (!srcAuthor2) {
      throw new Error(`${out} requires srcAuthor2`);
    }
    outBilaraData(xltsOut[1], ebtData);
    break;
  case 'oj1':
    outJson(xltsOut[0]);
    break;
  case 'oj2':
    if (!srcAuthor2) {
      throw new Error(`${out} requires srcAuthor2`);
    }
    outJson(xltsOut[1]);
    break;
  case 'ocqb':
    outCurlyQuotes(bdDeepL);
    break;
  case 'ocqe':
    outCurlyQuotes(ebtData);
    break;
}
