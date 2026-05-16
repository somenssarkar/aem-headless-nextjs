export const metadata = {
  title: 'Drop-In AI Widget · AEM Knowledge Hub',
  description: 'Add an AI knowledge assistant to any WordPress or Drupal site with one script tag.',
};

const SNIPPET = `<script
  src="https://aem-headless-nextjs.vercel.app/embed.js"
  data-source="wordpress"
  data-tenant="your-site"
  async>
</script>`;

export default function EmbedPage() {
  return (
    <div className="max-w-3xl">
      {/* Hero */}
      <div className="mb-10">
        <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
          Drop-In Widget
        </span>
        <h1 className="mt-4 text-3xl font-bold text-gray-900">
          AI Knowledge Assistant —<br />one script tag, any site
        </h1>
        <p className="mt-3 text-gray-500 text-base leading-relaxed">
          Embed a RAG-powered chat assistant trained on your WordPress or Drupal
          content into any site. No migration, no rebuild, no DevOps.
        </p>
      </div>

      {/* Code snippet */}
      <div className="mb-10 rounded-xl overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-4 py-2 bg-slate-900">
          <span className="text-xs text-slate-400 font-mono">footer.php / footer.html</span>
          <span className="text-xs text-slate-500">Paste before &lt;/body&gt;</span>
        </div>
        <pre className="bg-slate-950 text-green-400 text-sm font-mono px-5 py-4 overflow-x-auto leading-relaxed">
          {SNIPPET}
        </pre>
      </div>

      {/* What it does */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">What happens</h2>
        <ol className="space-y-3">
          {[
            'The script injects a transparent iframe into your page — fixed bottom-right, 80 × 80 px.',
            'Visitors click the chat button. The iframe expands to a full chat panel with a smooth transition.',
            'Questions are answered using RAG — retrieval from a pgvector store of your ingested content, grounded by Gemini.',
            'Source badges show which article or post each answer comes from.',
            'Closing the panel shrinks the iframe back to the button. No layout shift, no reflow.',
          ].map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex-none w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <span className="text-gray-600 text-sm leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Attributes */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Script attributes</h2>
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold w-40">Attribute</th>
                <th className="px-4 py-3 font-semibold w-40">Values</th>
                <th className="px-4 py-3 font-semibold">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                {
                  attr: 'data-source',
                  values: 'wordpress · drupal · aem-cf · eds',
                  desc: 'Scopes the assistant header to your CMS. Does not filter retrieval — the assistant searches across all ingested sources.',
                },
                {
                  attr: 'data-tenant',
                  desc: 'Your site identifier. Passed as a query param to the chat embed — reserved for per-tenant retrieval scoping in future versions.',
                  values: 'any string',
                },
                {
                  attr: 'async',
                  values: '(boolean)',
                  desc: 'Always include this. The script loads asynchronously so it never blocks page render.',
                },
              ].map(row => (
                <tr key={row.attr}>
                  <td className="px-4 py-3 font-mono text-blue-700 text-xs">{row.attr}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{row.values}</td>
                  <td className="px-4 py-3 text-gray-600">{row.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* WordPress instructions */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Add to WordPress</h2>
        <div className="space-y-2 text-sm text-gray-600">
          <p className="font-medium text-gray-700">Option A — Theme editor (classic themes)</p>
          <ol className="ml-4 space-y-1 list-decimal list-outside">
            <li>WP Admin → Appearance → Theme File Editor</li>
            <li>Open <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">footer.php</code></li>
            <li>Paste the script tag immediately before <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">&lt;/body&gt;</code></li>
            <li>Save. Refresh your site — the chat button appears bottom-right.</li>
          </ol>
          <p className="font-medium text-gray-700 pt-3">Option B — Plugin (block themes / safer)</p>
          <ol className="ml-4 space-y-1 list-decimal list-outside">
            <li>Install <strong>Insert Headers and Footers</strong> plugin</li>
            <li>Settings → Insert Headers and Footers → Scripts in Footer</li>
            <li>Paste the script tag → Save</li>
          </ol>
        </div>
      </div>

      {/* CSP note */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
        <p className="font-semibold mb-1">Content Security Policy</p>
        <p>
          If your site uses a strict CSP, add{' '}
          <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs">aem-headless-nextjs.vercel.app</code>{' '}
          to both <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs">script-src</code> and{' '}
          <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs">frame-src</code> directives.
        </p>
      </div>

      {/* Live preview note */}
      <div className="mt-10 pt-8 border-t border-gray-200">
        <p className="text-sm text-gray-400">
          The chat button visible on this page is the same widget — powered by{' '}
          <span className="text-gray-600 font-medium">Supabase pgvector</span> +{' '}
          <span className="text-gray-600 font-medium">Gemini</span>.
          Try asking about AEM, WordPress, or Drupal.
        </p>
      </div>
    </div>
  );
}
