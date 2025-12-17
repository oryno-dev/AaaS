// OpenRouter integration for structured JSON-only outputs
// Requires env: OPENROUTER_API_KEY, optional: OPENROUTER_MODEL

export type OpenRouterMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export async function callOpenRouter(messages: OpenRouterMessage[], model?: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set');
  const mdl = model || process.env.OPENROUTER_MODEL || 'openrouter/anthropic/claude-3.5-sonnet';
  if (!mdl) throw new Error('No model specified. Set OPENROUTER_MODEL or pass a model.');
  const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: mdl,
      messages,
      response_format: { type: 'json_object' }
    })
  });
  if (!resp.ok) {
    let bodyText = '';
    try { bodyText = await resp.text(); } catch {}
    throw new Error(`OpenRouter HTTP ${resp.status}: ${bodyText}`);
  }
  const json = await resp.json();
  const content = json.choices?.[0]?.message?.content;
  if (typeof content !== 'string') throw new Error('No content');
  return content;
}
