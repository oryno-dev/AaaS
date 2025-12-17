#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { cleanAndStabilizeSvg } from './index.js';

const argv = yargs(hideBin(process.argv))
  .option('in', { type: 'string', demandOption: true, describe: 'Input raster or SVG (png/jpg/svg)' })
  .option('out', { type: 'string', demandOption: true, describe: 'Output SVG path' })
  .option('no-inkscape', { type: 'boolean', default: false, describe: 'Skip inkscape raster conversion (expects SVG input)' })
  .strict()
  .help()
  .parseSync();

const inputPath = path.resolve(String(argv.in));
const outputPath = path.resolve(String(argv.out));
const ext = path.extname(inputPath).toLowerCase();

let svg: string;
if (ext === '.svg' || argv['no-inkscape']) {
  svg = fs.readFileSync(inputPath, 'utf8');
} else {
  // Prefer inkscaper if available
  try {
    const { Inkscape } = await import('inkscaper');
    const tmpOut = outputPath + '.tmp.svg';
    const ins = new Inkscape([inputPath, `--export-plain-svg=${tmpOut}`]);
    const res = ins.runSync();
    if (res.status !== 0) throw new Error('inkscaper returned non-zero');
    svg = fs.readFileSync(tmpOut, 'utf8');
    fs.unlinkSync(tmpOut);
  } catch {
    // Fallback to raw inkscape CLI
    const tmpOut = outputPath + '.tmp.svg';
    const res = spawnSync('inkscape', [inputPath, `--export-plain-svg=${tmpOut}`], { encoding: 'utf8' });
    if (res.status !== 0) {
      console.error('Inkscape failed. Ensure inkscape is installed and on PATH, or pass --no-inkscape for SVG inputs.');
      process.exit(1);
    }
    svg = fs.readFileSync(tmpOut, 'utf8');
    fs.unlinkSync(tmpOut);
  }
}

const cleaned = cleanAndStabilizeSvg(svg);
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, cleaned);
console.log(`Wrote ${outputPath}`);
