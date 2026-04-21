import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'AEM Developer Knowledge Hub',
  description: 'Technical articles, FAQs and tutorials on AEM, AEP and AJO.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <nav className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-6">
            <Link href="/" className="font-bold text-blue-700 text-lg tracking-tight">
              AEM Knowledge Hub
            </Link>
            <Link href="/articles" className="text-sm text-gray-600 hover:text-blue-700">Articles</Link>
            <Link href="/faqs" className="text-sm text-gray-600 hover:text-blue-700">FAQs</Link>
            <Link href="/tutorials" className="text-sm text-gray-600 hover:text-blue-700">Tutorials</Link>
          </nav>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
