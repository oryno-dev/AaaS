#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { svgToElementSchema } from './index.js';
import { makeElementValidator } from '@realify/schemas/dist/validate.js';

const argv = yargs(hideBin(process.argv))
  .option('in', { type: 'string', demandOption: true, describe: 'Input SVG file' })
  .option('out', { type: 'string', demandOption: true, describe: 'Output JSON file (Element Schema)' })
  .strict()
  .help()
  .parseSync();

const inputPath = path.resolve(process.cwd(), argv.in as string);
const outputPath = path.resolve(process.cwd(), argv.out as string);

const svg = fs.readFileSync(inputPath, 'utf8');
const schema = svgToElementSchema(svg, { source: path.basename(inputPath) });

const validate = makeElementValidator();
if (!validate(schema)) {
  console.error('Schema validation failed:', validate.errors);
  process.exit(1);
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(schema, null, 2));
console.log(`Wrote ${outputPath}`);
