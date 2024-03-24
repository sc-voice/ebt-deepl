#!/usr/bin/env node
import fs from "fs";
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { BilaraData } from 'scv-bilara'
import { default as SuttaTranslator } from "../src/sutta-translator.mjs"
import pkgScvEsm  from "scv-esm";
const { SuttaRef, AuthorsV2 } = pkgScvEsm;
const cwd = process.cwd();

const EBT_DEEPL = 'ebt-deepl';

let suid;
let srcLang = 'it';;
let srcAuthor = EBT_DEEPL;
let dstAuthor;
let dstReplace = false;
let [nodePath, scriptPath, ...args] = process.argv;
let script = scriptPath.split('/').pop();
let category = 'sutta';

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
    unpublish - upload pre-translation to bilara-data-deepl

SYNOPSIS
    unpublish [OPTIONS] sutta_uid

DESCRIPTION
    Copy ebt-deepl sutta from ebt-data repository to unpublished
    branch of bilara-data-deepl

    -da, --dst-author
        Destination author. Normally required. For Italian, 
        default is 'mahabodhi'.

    -dr, --dst-replace
        Replace existing destination file. Default is false.

    -sa, --src-author
        Source author. Default is 'ebt-deepl'

    -sl, --src-lang
        Source language. Default is 'it'.
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
  } else if (arg === '-da' || arg === '--dst-author') {
    dstAuthor = args[++i];
  } else if (arg === '-dr' || arg === '--dst-replace') {
    dstReplace = true;
  } else if (arg === '-sl' || arg === '--src-lang') {
    srcLang = args[++i];
  } else if (arg === '-sa' || arg === '--src-author') {
    srcAuthor = args[++i];
  } else if (arg.startsWith('-')) {
    console.warn(`Invalid argument: "${arg}". Try:`);
    console.warn('  scripts/translate.mjs --help');
    process.exit(-1);
  } else {
    suid = args[i];
  }
}

const msg = `${script}:\t`;
const emsg = `${msg}[ERROR]`;
if (dstAuthor == null) {
  switch (srcLang) {
    case 'it':
      dstAuthor = 'mahabodhi';
      break;
  }
}

console.log(msg, {suid, srcAuthor, srcLang, dstAuthor});
if (suid == null) {
  console.log(emsg, "No sutta_uid specified");
  process.exit(-1);
}
if (srcLang == null) {
  console.log(emsg, "srcLang is required");
  process.exit(-1);
}
if (dstAuthor == null) {
  console.log(emsg, "dstAuthor is required");
  process.exit(-1);
}

let sref = SuttaRef.create(suid);
if (sref == null) {
  throw new Error(`Invalid SuttaRef ${suid}`);
}
let { sutta_uid, lang, author, segnum, scid } = sref;

let srcRef1 = {sutta_uid, lang:srcLang, author:srcAuthor}

async function outBilaraData(bd) {
  const msg = `${script}.outBilaraData()`;
  const dbg = 1;
  const { name } = bd;
  let outDir = path.join(__dirname, 
    `../local/${name}/translation`,
    srcLang,
    dstAuthor,
    category,
    );
  let pliPath  = bd.docPaths(sref)[0];
  let dstPath = pliPath
    .replace('root/pli/ms', 
      ['translation', srcLang, dstAuthor].join('/'))
    .replace('root-pli-ms',
      ['translation', srcLang, dstAuthor].join('-'));
  let dstDir = path.dirname(dstPath);
  let dstBase = path.basename(dstPath);
  let inDir = path.join(__dirname,
    `../local/${ebtData.name}/translation`,
    srcLang,
    srcAuthor,
    category,
    );
  let srcPath = dstPath
    .replace(outDir, inDir)
    .replace(dstAuthor, srcAuthor);
  let srcDir = path.dirname(srcPath);
  let srcBase = path.basename(srcPath);
  console.log(msg, {srcPath, dstPath});

  console.warn(msg, 'mkdir:', dstDir.replace(cwd,'').substring(1));
  await fs.promises.mkdir(dstDir, { recursive: true })
  let data = await fs.promises.readFile(srcPath);
  let dataBytes = data.length;

  let dstExists;
  try {
    let res = await fs.promises.stat(dstPath);
    dstExists = true;
  } catch(e) { // file does not exist
    dstExists = false;
  }
  if (dstExists) {
    if (!dstReplace) {
      console.warn(msg, 'CANCELLED (file exists)', dstBase);
      console.warn(msg, 'override with "--dst-replace"');
      return;
    }
    console.warn(msg, 'overwriting:', dstBase);
  }
  console.log(msg, `writing ${dataBytes} bytes:`, dstPath);
  await fs.promises.writeFile(dstPath, data);
}

outBilaraData(bdDeepL);
