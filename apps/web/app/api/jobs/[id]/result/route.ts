import { getJobResult } from '@/lib/jobs';
export const runtime = 'nodejs';

export async function GET(_req: Request, { params }: { params: { id: string }}) {
  const id = params.id;
  const file = await getJobResult(id);
  if (!file) return new Response('Not found', { status: 404 });
  return new Response(file.stream, {
    headers: {
      'Content-Type': file.mime,
      'Content-Length': String(file.size)
    }
  });
}
