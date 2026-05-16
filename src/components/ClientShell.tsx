'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChatWidget } from './ChatWidget';

export function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === '/chat-embed') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 antialiased">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <nav className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-6">
          <Link href="/" className="font-bold text-blue-700 text-lg tracking-tight">
            AEM Knowledge Hub
          </Link>
          <Link href="/articles" className="text-sm text-gray-600 hover:text-blue-700">Articles</Link>
          <Link href="/faqs" className="text-sm text-gray-600 hover:text-blue-700">FAQs</Link>
          <Link href="/tutorials" className="text-sm text-gray-600 hover:text-blue-700">Tutorials</Link>
          <Link href="/blog" className="text-sm text-gray-600 hover:text-blue-700">Blog</Link>
          <Link href="/wp" className="text-sm text-gray-600 hover:text-amber-600">WordPress</Link>
          <Link href="/drupal" className="text-sm text-gray-600 hover:text-indigo-700">Drupal</Link>
          <Link href="/embed" className="text-sm text-gray-600 hover:text-blue-700 ml-auto">Embed Widget</Link>
        </nav>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
      <ChatWidget />
    </div>
  );
}
