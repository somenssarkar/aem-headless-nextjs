import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

// Manual on-demand utility — call from curl or CI to regenerate a single article's SEO description.
// Auto-generation for all articles happens in scripts/ingest-aem-cfs.ts at ingest time.
export async function POST(req: Request) {
  const { cfPath, body, title, secret } = await req.json();

  if (secret !== process.env.REVALIDATE_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { text } = await generateText({
    model: google('gemini-3-flash-preview'),
    prompt: `Write a 2-sentence SEO meta description for this AEM developer article.
Be specific, mention the key technologies, keep it under 155 characters total.

Title: ${title ?? ''}
Article content:
${(body ?? '').slice(0, 2000)}

SEO Description (2 sentences, under 155 chars):`,
  });

  const khSeoDescription = text.trim();

  // PATCH to AEM Author — Author-only setup, no Publish instance needed
  const aemRes = await fetch(`${process.env.AEM_HOST}/api/assets${cfPath}`, {
    method: 'PATCH',
    headers: {
      Authorization: process.env.AEM_AUTH!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      class: 'asset',
      properties: { khSeoDescription },
    }),
  });

  if (!aemRes.ok) {
    return Response.json({ error: `AEM PATCH failed: ${aemRes.status}` }, { status: 502 });
  }

  return Response.json({ khSeoDescription, cfPath });
}
