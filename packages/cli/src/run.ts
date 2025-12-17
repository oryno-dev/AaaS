#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { bundle } from '@remotion/bundler';
import { getCompositions, renderMedia } from '@remotion/renderer';
import { cleanAndStabilizeSvg } from '@realify/vectorizer/dist/index.js';
import { svgToElementSchema } from '@realify/mapper/dist/index.js';
import { validateGeneration } from '@realify/validator/dist/index.js';
import { generateMotionFromBeats } from '@realify/llm-gates/dist/generate.js';
import type { MotionIR } from '@realify/motion-ir';
import type { ElementSchema } from '@realify/schemas';
import { makeVideoComponent } from './Video.js';
import { RemotionRoot } from './RemotionRoot.js';
import React from 'react';

const argv = yargs(hideBin(process.argv))
  .command('run', 'Run full pipeline', (y) => y
    .option('in', { type: 'string', demandOption: true, describe: 'Input image (png|jpg|svg)' })
    .option('prompt', { type: 'string', demandOption: true, describe: 'Narrative prompt (beats/intents)' })
    .option('format', { type: 'string', default: 'mp4', choices: ['mp4','webm'] })
    .option('outDir', { type: 'string', default: './out' })
    .option('model', { type: 'string', describe: 'OpenRouter model id (overrides OPENROUTER_MODEL)' })
  )
  .strict()
  .help()
  .parseSync();

async function main() {
  const cmd = (argv._[0] || 'run') as string;
  if (cmd !== 'run') throw new Error('Unknown command');
  const inputPath = path.resolve(String(argv.in));
  const prompt = String(argv.prompt);
  const format = String(argv.format);
  const outDir = path.resolve(String(argv.outDir));
  if (argv.model) process.env.OPENROUTER_MODEL = String(argv.model);

  fs.mkdirSync(outDir, { recursive: true });

  // Vectorize
  const ext = path.extname(inputPath).toLowerCase();
  let svg: string;
  if (ext === '.svg') {
    svg = fs.readFileSync(inputPath, 'utf8');
  } else {
    // use vectorizer cli to handle inkscape/inkscaper paths reliably
    const tmpSvg = path.join(os.tmpdir(), `realify_${Date.now()}.svg`);
    const res = spawnSync('node', [path.join(process.cwd(), 'packages/vectorizer/dist/cli.js'), '--in', inputPath, '--out', tmpSvg], { stdio: 'inherit' });
    if (res.status !== 0) throw new Error('vectorizer failed');
    svg = fs.readFileSync(tmpSvg, 'utf8');
    fs.unlinkSync(tmpSvg);
  }
  const cleaned = cleanAndStabilizeSvg(svg);

  // Map to Element Schema
  const elements: ElementSchema = svgToElementSchema(cleaned, { source: path.basename(inputPath) });

  // LLM step: beats -> Motion IR
  const motionRes = await generateMotionFromBeats(prompt, JSON.stringify(elements));
  if (!motionRes.ok) {
    console.error('Motion generation failed:', motionRes.errors);
    process.exit(1);
  }
  const motion: MotionIR = motionRes.value;

  // Validate
  const val = validateGeneration(elements, motion);
  if (!val.ok) {
    console.error('Validation failed:', val.issues);
    process.exit(1);
  }

  // Render using Remotion
  const durationInFrames = Math.max(1, Math.ceil(motion.timeline));
  const fps = 30;
  const width = elements.meta.width || 1280;
  const height = elements.meta.height || 720;

  // Create a dynamic entry that binds the IR
  // Create a dynamic entry that binds the IR (currently composition uses default props)
  const entry = path.join(process.cwd(), 'packages/cli/src/RemotionRoot.tsx');
  const bundleLocation = await bundle(entry, undefined, {
    webpackOverride: (config: any) => config,
  });

  const comps = await getCompositions(bundleLocation, {
    inputProps: { svg: cleaned },
  });
  const composition = comps.find((c) => c.id === 'RealifyVideo');
  if (!composition) throw new Error('Composition RealifyVideo not found');

  const outFile = path.join(outDir, `realify.${format}`);
  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: format === 'mp4' ? 'h264' : 'vp8',
    outputLocation: outFile,
    inputProps: { svg: cleaned },
    onStart: () => console.log('Rendering...'),
  });

  console.log(`Done. Video at ${outFile}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
