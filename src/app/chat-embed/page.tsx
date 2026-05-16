import { ChatWidget } from '@/components/ChatWidget';

export default async function ChatEmbedPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string; tenant?: string }>;
}) {
  const { source, tenant } = await searchParams;
  return <ChatWidget source={source} tenant={tenant} />;
}
