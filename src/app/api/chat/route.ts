import { streamText, convertToModelMessages } from 'ai';
import { google } from '@ai-sdk/google';
import { GoogleGenAI } from '@google/genai';
import { getSupabase } from '@/lib/supabase';

export const runtime = 'nodejs';

const genai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY! });

// Maps model name → source key for chunks ingested before the adapter refactor
function inferSource(chunk: any): string {
  if (chunk.metadata?.source) return chunk.metadata.source;
  if (['Article', 'FAQ', 'TutorialStep', 'Author'].includes(chunk.model)) return 'aem-cf';
  if (chunk.model === 'EDS_BlogPost') return 'eds';
  return '';
}

const SOURCE_LABELS: Record<string, string> = {
  'aem-cf':   'AEM CF',
  'eds':      'AEM EDS',
  'wordpress': 'WordPress',
  'drupal':   'Drupal',
};

function extractAuthorFilter(query: string): string | null {
  const patterns = [
    /(?:authored|written|published)\s+by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    /articles?\s+by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    /what\s+(?:has|did)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:written|authored|published)/i,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)['']?s\s+articles?/i,
  ];
  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

export async function POST(req: Request) {
  const { messages } = await req.json();

  const lastMessage = messages[messages.length - 1];
  const userMessage: string = (lastMessage?.parts ?? [])
    .filter((p: { type: string }) => p.type === 'text')
    .map((p: { text: string }) => p.text)
    .join('');

  // 1. Embed the query
  const embedResult = await genai.models.embedContent({
    model: 'gemini-embedding-001',
    contents: [userMessage],
    config: { taskType: 'RETRIEVAL_QUERY', outputDimensionality: 768 },
  });
  const embedding = embedResult.embeddings?.[0].values!;

  // 2. Author filter detection
  const authorFilter = extractAuthorFilter(userMessage);

  // 3. Retrieve top-5 chunks
  const { data: chunks, error } = await getSupabase().rpc('match_cf_chunks', {
    query_embedding: embedding,
    match_count: 5,
    ...(authorFilter ? { filter_author: authorFilter } : {}),
  });
  if (error) throw new Error(`Supabase RPC error: ${error.message}`);

  // 4. Build grounded context — include CMS label so the LLM can cite sources naturally
  const context = (chunks ?? [])
    .map((c: any) => {
      const source = inferSource(c);
      const cmsLabel = SOURCE_LABELS[source] ?? source;
      const author = c.metadata?.authorName ? ` | Author: ${c.metadata.authorName}` : '';
      return `[Source: ${c.metadata?.title ?? c.path}${author} | CMS: ${cmsLabel} | Type: ${c.model}]\n${c.content}`;
    })
    .join('\n\n---\n\n');

  const modelMessages = await convertToModelMessages(messages);

  // 5. Stream response — client infers source badges from the response text
  const result = streamText({
    model: google('gemini-3-flash-preview'),
    system: `You are the AEM Developer Knowledge Hub assistant.
Answer questions using ONLY the context below. Do not add information not present in the context.
If the answer is not covered by the context, say: "I don't have information on that in the knowledge base."
Always mention which article or FAQ your answer comes from, and which CMS it is from (AEM CF, AEM EDS, WordPress, or Drupal).

RETRIEVED CONTEXT:
${context}`,
    messages: modelMessages,
  });

  return result.toUIMessageStreamResponse();
}
