import type { Metadata } from 'next';
import './globals.css';
import { ClientShell } from '@/components/ClientShell';

export const metadata: Metadata = {
  title: 'AEM Developer Knowledge Hub',
  description: 'Technical articles, FAQs and tutorials on AEM, AEP and AJO.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* background: transparent so /chat-embed iframe shows through to the EDS page beneath */}
      <body style={{ background: 'transparent' }}>
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
