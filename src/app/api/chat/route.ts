import { streamText, convertToModelMessages } from 'ai';
import { google } from '@ai-sdk/google';
import { GoogleGenAI } from '@google/genai';
import { getSupabase } from '@/lib/supabase';

export const runtime = 'nodejs';

const genai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY! });

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

  // Extract the last user message text from UIMessage parts (v6 format)
  const lastMessage = messages[messages.length - 1];
  const userMessage: string = (lastMessage?.parts ?? [])
    .filter((p: { type: string }) => p.type === 'text')
    .map((p: { text: string }) => p.text)
    .join('');

  // 1. Embed the user's question — RETRIEVAL_QUERY is asymmetric from RETRIEVAL_DOCUMENT
  const result = await genai.models.embedContent({
    model: 'gemini-embedding-001',
    contents: [userMessage],
    config: { taskType: 'RETRIEVAL_QUERY', outputDimensionality: 768 },
  });
  const embedding = result.embeddings?.[0].values!;

  // 2. Detect author-intent queries and apply structured metadata filter
  const authorFilter = extractAuthorFilter(userMessage);

  // 3. Retrieve top-5 semantically similar chunks — with optional author filter
  const { data: chunks, error } = await getSupabase().rpc('match_cf_chunks', {
    query_embedding: embedding,
    match_count: 5,
    ...(authorFilter ? { filter_author: authorFilter } : {}),
  });
  if (error) throw new Error(`Supabase RPC error: ${error.message}`);

  // 4. Build grounded context block with author attribution
  const context = (chunks ?? [])
    .map((c: any) => {
      const author = c.metadata?.authorName ? ` | Author: ${c.metadata.authorName}` : '';
      return `[Source: ${c.metadata?.title ?? c.path}${author} | Type: ${c.model}]\n${c.content}`;
    })
    .join('\n\n---\n\n');

  // 5. Stream Gemini response — grounded to retrieved context only
  const modelMessages = await convertToModelMessages(messages);

  const streamResult = streamText({
    model: google('gemini-3-flash-preview'),
    system: `You are the AEM Developer Knowledge Hub assistant.
Answer questions using ONLY the context below. Do not add information not present in the context.
If the answer is not covered by the context, say: "I don't have information on that in the knowledge base."
Always mention which article or FAQ your answer comes from, including the author name when available.

RETRIEVED CONTEXT:
${context}`,
    messages: modelMessages,
  });

  return streamResult.toUIMessageStreamResponse();
}
