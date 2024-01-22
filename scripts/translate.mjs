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
let sutta_uid;
let srcLang1 = 'en';
let srcAuthor1;
let srcLang2 = 'de';
let srcAuthor2;
let dstLang = 'pt';
let dstAuthor = EBT_DEEPL;
let refLang;
let refAuthor;
let [nodePath, scriptPath, ...args] = process.argv;
let bilaraData = await new BilaraData({name:'ebt-data'}).initialize();
let category = 'sutta';

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

    -da, --dst-author
        Destination author. Default is 'ebt-deepl'

    -dl, --dst-lang
        Destination language. Default is 'pt'.

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

    -oe1, --out-ebt-data1
        Output JSON translation from source1 to local/ebt-data
        using ebt-deepl author.

    -oe2, --out-ebt-data2
        Output JSON translation from source1 to local/ebt-data
        using ebt-deepl author.

    -oj1, --out-json1
        Output JSON to stdout from source 1

    -oj2, --out-json2
        Output JSON to stdout from source 2

    -oa, --out-all
        Output Pali, source1, source2, reference, translation1,
        translation2 texts. This is the default
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
  } else if (arg === '-oe1' || arg === '--out-ebt-data1') {
    out = 'oe1';
  } else if (arg === '-oe2' || arg === '--out-ebt-data2') {
    out = 'oe2';
  } else {
    sutta_uid = args[i];
  }
}

srcAuthor1 = srcAuthor1 || AuthorsV2.langAuthor(srcLang1);
srcAuthor2 = srcAuthor2 || AuthorsV2.langAuthor(srcLang2);
refLang = refLang || dstLang;
refAuthor = refAuthor || AuthorsV2.langAuthor(refLang);

let xlts = [
  await SuttaTranslator.create({
    srcLang: srcLang1, 
    srcAuthor: srcAuthor1,
    dstLang,
    dstAuthor,
    bilaraData,
  }),
  await SuttaTranslator.create({
    srcLang: srcLang2, 
    srcAuthor: srcAuthor2,
    dstLang,
    dstAuthor,
    bilaraData,
  }),
];

let srcRef1 = {sutta_uid, lang:srcLang1, author:srcAuthor1}
let srcRef2 = {sutta_uid, lang:srcLang2, author:srcAuthor2}
let refRef = {sutta_uid, lang:dstLang, author:refAuthor}
let pliRef = {sutta_uid, lang:'pli', author: 'ms'}
let { segments: pliSegs, } = await xlts[0].loadSutta(pliRef);
let { segments: refSegs } = 
  await SuttaTranslator.loadSutta(refRef, {bilaraData});
let { segments: srcSegs1 } = 
  await SuttaTranslator.loadSutta(srcRef1, {bilaraData});
let { segments: srcSegs2 } = 
  await SuttaTranslator.loadSutta(srcRef2, {bilaraData});

let xltsOut = [];
for (let i=0; i<xlts.length; i++) {
  let xlt = xlts[i];
  xltsOut[i] = await xlt.translate(sutta_uid);
}

let scids = Object.keys(pliSegs);

function outAll() {
  console.log(`Sutta    : ${sutta_uid}`);
  console.log(`Source1  : ${srcLang1}/${srcAuthor1}`);
  console.log(`Source2  : ${srcLang2}/${srcAuthor2}`);
  console.log(`Reference: ${refLang}/${refAuthor}`);
  console.log(`Target   : ${dstLang}/${dstAuthor}`);

  for (let i=0; i<scids.length; i++) {
    let scid = scids[i];

    console.log('-----', scid, '-----');
    console.log(`pli:\t`, pliSegs[scid]);
    console.log(`${srcLang1}:\t`, srcSegs1[scid]);
    console.log(`${srcLang2}:\t`, srcSegs2[scid]);
    console.log(`ref:\t`, refSegs && refSegs[scid]);
    console.log(`${srcLang1}-${dstLang}:\t`, xltsOut[0].dstSegs[scid]);
    console.log(`${srcLang2}-${dstLang}:\t`, xltsOut[1].dstSegs[scid]);
  }
}

function outJson(xltOut) {
  console.log(JSON.stringify(xltOut.dstSegs, null, 2));
}

async function outEbtData(xltOut) {
  const msg = 'translate.outEbtData()';
  let outDir = path.join(__dirname, 
    '../local/ebt-data/translation',
    dstLang,
    EBT_DEEPL,
    category,
    );
  let sref = SuttaRef.create(sutta_uid);
  let pliPath  = bilaraData.docPaths(sref)[0];
  let dstPath = pliPath
    .replace('root/pli/ms', 
      ['translation', dstLang, dstAuthor].join('/'))
    .replace('root-pli-ms',
      ['translation', dstLang, dstAuthor].join('-'));
  let dstDir = path.dirname(dstPath);

  console.log(msg, 'creating:', dstDir.replace(cwd,'').substring(1));
  await fs.promises.mkdir(dstDir, { recursive: true })
  let json = JSON.stringify(xltOut.dstSegs, null, 2);
  let dstBase = path.basename(dstPath);
  console.log(msg, 'writing:', dstBase, `${json.length}B`);
  await fs.promises.writeFile(dstPath, json);
  console.log(msg, `translated ${dstBase}`);
}

switch (out) {
  case 'all': 
    outAll();
    break;
  case 'oe1':
    outEbtData(xltsOut[0]);
    break;
  case 'oe2':
    outEbtData(xltsOut[1]);
    break;
  case 'oj1':
    outJson(xltsOut[0]);
    break;
  case 'oj2':
    outJson(xltsOut[1]);
    break;
}
