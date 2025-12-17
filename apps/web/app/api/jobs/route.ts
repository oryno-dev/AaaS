import { createJob } from '@/lib/jobs';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  if (!process.env.OPENROUTER_API_KEY) {
    return new Response('Server missing OPENROUTER_API_KEY', { status: 500 });
  }
  const form = await req.formData();
  const file = form.get('file');
  const prompt = String(form.get('prompt') || '');
  const model = String(form.get('model') || '');
  const format = String(form.get('format') || 'mp4');
  if (!(file && prompt)) return new Response('file and prompt required', { status: 400 });
  if (!(file instanceof File)) return new Response('invalid file', { status: 400 });
  const id = await createJob({ file, prompt, model, format });
  return Response.json({ id });
}
