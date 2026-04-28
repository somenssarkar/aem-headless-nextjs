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

  // Write to AEM Author via Sling POST Servlet — updates the CF data node directly.
  // cfPath is the JCR path e.g. /content/dam/kh/us/en/articles/getting-started-aem-graphql
  const aemRes = await fetch(
    `${process.env.AEM_HOST}${cfPath}/jcr:content/data/master`,
    {
      method: 'POST',
      headers: {
        Authorization: process.env.AEM_AUTH!,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ khSeoDescription }).toString(),
    }
  );

  if (!aemRes.ok) {
    return Response.json({ error: `AEM write failed: ${aemRes.status}` }, { status: 502 });
  }

  return Response.json({ khSeoDescription, cfPath });
}
