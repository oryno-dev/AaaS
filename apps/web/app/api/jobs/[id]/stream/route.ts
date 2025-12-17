import { getJobStream } from '@/lib/jobs';
export const runtime = 'nodejs';

export async function GET(_req: Request, { params }: { params: { id: string }}) {
  const id = params.id;
  const stream = getJobStream(id);
  if (!stream) return new Response('Not found', { status: 404 });
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive'
    }
  });
}
