#!/usr/bin/env node
import { logger } from 'log-instance';
logger.logLevel = 'warn';
import { BilaraData } from 'scv-bilara'
import { default as SuttaTranslator } from "../src/sutta-translator.mjs"
import pkgScvEsm  from "scv-esm";
const { AuthorsV2 } = pkgScvEsm;

let sutta_uid;
let srcLang1 = 'en';
let srcAuthor1;
let srcLang2 = 'de';
let srcAuthor2;
let dstLang = 'pt';
let dstAuthor = 'deepl';
let refLang = 'pt';
let refAuthor;
let [nodePath, scriptPath, ...args] = process.argv;
let bilaraData = await new BilaraData({name:'ebt-data'}).initialize();

function help() {
  console.log(`
NAME
    translate - translate ebt-data sutta

SYNOPSIS
    translate [OPTIONS] sutta_uid

DESCRIPTION
    Translates sutta from source language (srcLang) to destination
    language (dstLang).

    -da, --dst-author
        Destination author. 

    -dl, --dst-lang
        Destination language. Default is 'pt'.

    -ra, --ref-author
        Reference author. Default is determined from reference language.

    -rl, --ref-lang
        Reference language. Default is 'de'.

    -sa1, --src-author1
        Source author #1. Default is determined from source language.

    -sa2, --src-author2
        Source author #2. Default is determined from source language.

    -sl1, --src-lang1
        Source language #1. Default is 'de'.

    -sl2, --src-lang2
        Source language #2. Default is 'en'.
`);
}

if (args.length < 1) {
  help();
  process.exit(0);
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
  } else {
    sutta_uid = args[i];
  }
}
srcAuthor1 = srcAuthor1 || AuthorsV2.langAuthor(srcLang1);
srcAuthor2 = srcAuthor2 || AuthorsV2.langAuthor(srcLang2);
refAuthor = refAuthor || AuthorsV2.langAuthor(refLang);

console.log(`Sutta    : ${sutta_uid}`);
console.log(`Source1  : ${srcLang1}/${srcAuthor1}`);
console.log(`Source2  : ${srcLang2}/${srcAuthor2}`);
console.log(`Reference: ${refLang}/${refAuthor}`);
console.log(`Target   : ${dstLang}/${dstAuthor}`);

let de_pt = await SuttaTranslator.create({
  srcLang: srcLang1, 
  srcAuthor: srcAuthor1,
  dstLang,
  dstAuthor,
});

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

for (let i=0; i<scids.length; i++) {
  let scid = scids[i];

  console.log('-----', scid, '-----');
  console.log(`pli:\t`, pliSegs[scid]);
  console.log(`${srcLang1}:\t`, srcSegs1[scid]);
  console.log(`${srcLang2}:\t`, srcSegs2[scid]);
  console.log(`ref:\t`, refSegs[scid]);
  console.log(`${srcLang1}-${dstLang}:\t`, xltsOut[0].dstSegs[scid]);
  console.log(`${srcLang2}-${dstLang}:\t`, xltsOut[1].dstSegs[scid]);
}

