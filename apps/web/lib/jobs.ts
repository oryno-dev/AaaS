import { randomUUID } from 'crypto';
import { mkdir, writeFile, stat, readFile } from 'fs/promises';
import { spawn } from 'child_process';
import path from 'path';

const jobs = new Map<string, {
  logBuf: string;
  finished: boolean;
  ok: boolean;
  outPath?: string;
}>();

function sseEncode(obj: any) {
  return `data: ${JSON.stringify(obj)}\n\n`;
}

export async function createJob({ file, prompt, model, format }: { file: File; prompt: string; model: string; format: string; }) {
  const id = randomUUID();
  const baseDir = path.join(process.cwd(), '.data', 'jobs', id);
  await mkdir(baseDir, { recursive: true });
  const arrayBuf = await file.arrayBuffer();
  const inputPath = path.join(baseDir, file.name);
  await writeFile(inputPath, Buffer.from(arrayBuf));

  const outFile = path.join(baseDir, `realify.${format}`);
  const nodeBin = process.execPath; // current Node
  // Resolve CLI entry relative to monorepo root (two levels up from apps/web)
  const cliEntry = path.join(process.cwd(), '..', '..', 'packages', 'cli', 'dist', 'run.js');

  const args = [cliEntry, 'run', '--in', inputPath, '--prompt', prompt, '--format', format, '--outDir', baseDir];
  if (model) { args.push('--model', model); }

  const child = spawn(nodeBin, args, {
    env: { ...process.env, OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY },
    cwd: process.cwd()
  });

  jobs.set(id, { logBuf: '', finished: false, ok: false });

  child.stdout.on('data', (d) => {
    const s = d.toString();
    const job = jobs.get(id);
    if (!job) return;
    job.logBuf += s;
  });
  child.stderr.on('data', (d) => {
    const s = d.toString();
    const job = jobs.get(id);
    if (!job) return;
    job.logBuf += '[STDERR] ' + s;
  });
  child.on('exit', (code) => {
    const job = jobs.get(id);
    if (!job) return;
    job.finished = true;
    job.ok = code === 0;
    if (code === 0) {
      job.outPath = outFile;
      job.logBuf += `\n✓ Process exited with code 0\n`;
    } else {
      job.logBuf += `\n✗ Process exited with code ${code}\n`;
    }
  });

  return id;
}

export function getJobStream(id: string) {
  const job = jobs.get(id);
  if (!job) return null;
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    start(controller) {
      let sent = 0;
      let interval: NodeJS.Timeout | null = null;
      interval = setInterval(() => {
        const j = jobs.get(id);
        if (!j) return;
        if (j.logBuf.length > sent) {
          const chunk = j.logBuf.slice(sent);
          sent = j.logBuf.length;
          controller.enqueue(encoder.encode(sseEncode({ type: 'log', line: chunk })));
        }
        if (j.finished) {
          if (interval) clearInterval(interval);
          interval = null;
          controller.enqueue(encoder.encode(sseEncode({ type: 'done', ok: j.ok })));
          controller.close();
        }
      }, 300);
    },
    cancel() {}
  });
}

export async function getJobResult(id: string) {
  const job = jobs.get(id);
  if (!job || !job.outPath) return null;
  const st = await stat(job.outPath).catch(() => null);
  if (!st) return null;
  const buf = await readFile(job.outPath);
  return { stream: buf, size: st.size, mime: job.outPath.endsWith('.webm') ? 'video/webm' : 'video/mp4' };
}
