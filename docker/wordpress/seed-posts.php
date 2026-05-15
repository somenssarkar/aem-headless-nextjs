<?php
/**
 * WP-CLI seed script for the Multi-CMS Knowledge Hub demo.
 * Run via: docker compose run --rm wp-cli
 *
 * Creates 5 categories and 8 posts spanning AEM, Architecture,
 * DevOps, and AEP topics — mirrors the AEM CF category taxonomy.
 */

// ── Categories ────────────────────────────────────────────────────────────────

$categories = ['AEM', 'AEP', 'AJO', 'Architecture', 'DevOps'];
$cat_ids = [];
foreach ($categories as $name) {
    $existing = get_cat_ID($name);
    $cat_ids[$name] = $existing ?: wp_create_category($name);
    echo "Category '{$name}': id={$cat_ids[$name]}\n";
}

// ── Posts ─────────────────────────────────────────────────────────────────────

$posts = [];

// ── AEM #1 ───────────────────────────────────────────────────────────────────
$posts[] = [
    'title'      => 'Content Fragments vs Experience Fragments: When to Use Which in AEM',
    'excerpt'    => 'One of the most common questions I get from AEM developers: should I use a Content Fragment or an Experience Fragment here? The answer depends entirely on whether you are building for headless delivery or for reuse within AEM Sites.',
    'categories' => ['AEM'],
    'tags'       => 'Content Fragments, Experience Fragments, AEM Headless',
    'content'    => <<<HTML
<p>One of the most common questions I get from AEM developers is: "Should I use a Content Fragment or an Experience Fragment here?" The answer depends entirely on whether you're building for headless delivery or for reuse within the AEM Sites template system.</p>

<h2>Content Fragments: Pure Structured Data</h2>
<p>Content Fragments (CFs) are channel-agnostic structured content. Think of them as typed records in the JCR — a CF has typed fields (text, dates, references, enumerations) and no inherent visual presentation. When you access a CF via the GraphQL API, you get clean structured data that your front-end decides how to render.</p>
<p>Use CFs when:</p>
<ul>
  <li>Your content must be delivered to multiple channels (web, mobile, kiosks, third-party systems)</li>
  <li>You need tight content governance — CF models enforce field types and required fields at the JCR level</li>
  <li>Business users need to author in a structured, form-like interface rather than a page editor</li>
  <li>The same content feeds into an AI or RAG system alongside other sources</li>
</ul>

<h2>Experience Fragments: Reusable Presentation Units</h2>
<p>Experience Fragments (XFs) are AEM-rendered HTML units with full component composition. An XF can contain a hero image, a call-to-action, a card grid — all assembled via the AEM page editor. XFs are exported as HTML or synced to Adobe Target for A/B testing and personalization.</p>
<p>Use XFs when:</p>
<ul>
  <li>You're building page sections that repeat across multiple AEM Sites pages</li>
  <li>The component layout is part of the content (marketing landing sections)</li>
  <li>You need AEM-to-Target integration for offer-based personalization</li>
  <li>The primary consumer is AEM Sites, not an external API</li>
</ul>

<h2>The Rule of Thumb</h2>
<p>If the consumer is an API or a non-AEM front-end: use Content Fragments. If the consumer is AEM Sites: use Experience Fragments. In a headless architecture where Next.js fetches content via GraphQL, you will almost never need XFs — every content type becomes a CF model.</p>
<p>The confusion usually arises in hybrid projects where AEM simultaneously serves AEM Sites pages and a headless front-end. In that case, keep structured content in CFs (fetched by Next.js via GraphQL) and reserve XFs for AEM-rendered marketing sections that won't be re-used in headless contexts.</p>
HTML,
];

// ── AEM #2 ───────────────────────────────────────────────────────────────────
$posts[] = [
    'title'      => 'AEM Headless GraphQL: Writing Your First Persisted Query',
    'excerpt'    => 'AEM\'s headless GraphQL implementation uses persisted queries — named, CDN-cacheable endpoints stored in the JCR. This guide walks through writing, testing, and deploying your first persisted query end-to-end.',
    'categories' => ['AEM'],
    'tags'       => 'GraphQL, Persisted Queries, AEM Headless, API',
    'content'    => <<<HTML
<p>AEM's headless GraphQL implementation uses <em>persisted queries</em> — named query endpoints stored in the JCR and accessed via GET requests. Unlike ad-hoc GraphQL POST requests (the WPGraphQL approach), persisted queries are cacheable by CDN and dispatchable — a meaningful performance advantage at scale.</p>

<h2>Step 1: Enable the GraphQL Endpoint</h2>
<p>Go to <strong>Tools → General → GraphQL Endpoints</strong> and create a new endpoint associated with your Content Fragment Models configuration folder. This endpoint becomes the base for all persisted queries in your project.</p>

<h2>Step 2: Write the Query in GraphiQL</h2>
<p>Open the GraphiQL IDE at <code>/content/graphiql.html</code> on your AEM Author instance. AEM auto-generates a schema from your CF models — every model becomes a queryable type with <code>List</code> and <code>ByPath</code> variants.</p>
<pre><code>query ArticlesList {
  articleList {
    items {
      _path
      khTitle
      khCategory
      khSummary
      khPublishedDate
      khAuthor {
        khName
      }
    }
  }
}</code></pre>

<h2>Step 3: Persist and Name the Query</h2>
<p>Click "Save as" in GraphiQL and name your query using the convention <code>project-name/query-name</code>. For example: <code>knowledge-hub/articles-list</code>. AEM stores this in the JCR under <code>/conf/global/settings/graphql/persistentQueries</code>.</p>

<h2>Step 4: Execute via GET</h2>
<p>Your persisted query is now a CDN-cacheable GET endpoint:</p>
<pre><code>GET /graphql/execute.json/knowledge-hub/articles-list</code></pre>
<p>Variables are appended as semicolon-delimited values: <code>/articles-list;category=AEM</code>. This AEM-specific syntax differs from standard GraphQL variable passing but is necessary for CDN caching compatibility.</p>

<h2>Versioning and Replication</h2>
<p>Persisted queries must be replicated to AEM Publish before they're accessible to your front-end in production. Use the Replication UI or include them in your content package. In CI/CD pipelines, script replication via the Replication Agent REST API so query versions stay in sync with your front-end code deployments.</p>
HTML,
];

// ── AEM #3 ───────────────────────────────────────────────────────────────────
$posts[] = [
    'title'      => 'AEM Content Fragment Models: Designing for Headless and RAG Ingestion',
    'excerpt'    => 'Designing a CF model that works well for both headless delivery and AI ingestion requires thinking about field granularity, slug uniqueness, and how chunks will be embedded. Here\'s what I learned building the Knowledge Hub.',
    'categories' => ['AEM'],
    'tags'       => 'Content Fragment Models, AEM Headless, RAG, pgvector, AI',
    'content'    => <<<HTML
<p>Designing a Content Fragment model is deceptively simple — drag fields into a grid, name them, ship it. But a model that works well for headless delivery <em>and</em> for AI ingestion requires deliberate choices that aren't obvious until you're debugging why your RAG assistant is returning bad answers.</p>

<h2>Field Granularity: Separate Summary from Body</h2>
<p>The most important decision is keeping <code>summary</code> and <code>body</code> as separate fields rather than a single long-text field. For RAG ingestion, the summary and body become separate chunks with different embedding weights. A query like "what is AEM's headless architecture?" should hit the summary chunk, not wade through 2,000 words of implementation detail to find the answer.</p>
<p>Pattern: <code>khTitle</code> + <code>khSummary</code> → one chunk. <code>khBody</code> → second chunk (or chunked further for long articles).</p>

<h2>Slug Uniqueness: Enforce It in the Model</h2>
<p>AEM's GraphQL API does not enforce slug uniqueness — that's your responsibility in the CF model design. Add a <code>khSlug</code> single-line text field and document (in the model description) that it must be unique across the corpus. Use <code>idType: SLUG</code> in your WPGraphQL-equivalent queries. In practice, slugs become the stable identifier in the vector store's <code>path</code> field and in your Next.js dynamic routes.</p>

<h2>Avoid Rich Text for Machine-Readable Fields</h2>
<p>Rich text (HTML) fields are great for human-readable body content. But for fields that will be filtered, sorted, or used as query variables — category, tags, difficulty level — use single-line text or enumeration types. When a field is stored as HTML like <code>&lt;p&gt;AEM&lt;/p&gt;</code>, your GraphQL filter <code>khCategory: { _expressions: [{ value: "AEM" }] }</code> silently fails.</p>

<h2>Metadata Fields for Citation Rendering</h2>
<p>Add <code>khPublishedDate</code>, <code>khSourceLabel</code>, and <code>khCanonicalUrl</code> to every model that will appear in RAG search results. The citation component in your chat UI needs these to render the "Source: AEM Knowledge Hub — Published Jan 2026" badge under each answer. Retrofitting these fields later requires re-ingesting all existing CFs.</p>
HTML,
];

// ── Architecture #1 ──────────────────────────────────────────────────────────
$posts[] = [
    'title'      => 'Headless CMS Architecture in 2026: AEM, WordPress, or Drupal?',
    'excerpt'    => 'A client asked me: we have 3,000 WordPress posts and want to add an AI assistant. Do we migrate to AEM or stay on WordPress? The answer exposed architectural trade-offs that come up constantly in the headless CMS landscape.',
    'categories' => ['Architecture'],
    'tags'       => 'Headless CMS, Architecture, WordPress, Drupal, AEM',
    'content'    => <<<HTML
<p>A client asked me last month: "We have a WordPress site with 3,000 posts and we want to add an AI assistant that knows all of it. Do we migrate to AEM or stay on WordPress?" The answer exposed a set of architectural trade-offs that come up constantly in the current headless CMS landscape.</p>

<h2>AEM Content Fragments: Maximum Control, Maximum Investment</h2>
<p>AEM CF gives you typed content models enforced at the JCR level, a GraphQL API auto-generated from those models, built-in DAM, multi-site management, and deep Adobe Marketing Cloud integration. The trade-off: AEM requires significant infrastructure investment (AEMaaCS subscription or on-premise licensing) and authoring expertise that most teams don't have on day one.</p>
<p>Choose AEM when content governance, multi-site publishing, and Adobe stack integration are non-negotiable. Don't choose AEM because you want headless delivery — any of the three CMSes here can do that.</p>

<h2>WordPress + WPGraphQL: Fastest Time to Headless</h2>
<p>WordPress runs on $5/month shared hosting, has a plugin ecosystem of 60,000+ packages, and WPGraphQL exposes the entire WP schema through a single GraphQL endpoint in roughly ten minutes of setup. The trade-off: no built-in structured content governance, and the GraphQL schema is deeply coupled to WordPress's data model (posts, pages, taxonomies) rather than your domain model.</p>
<p>Choose WordPress when your content already lives there, your team knows PHP, and you need headless delivery without a migration project. The answer for my client's 3,000-post site: stay on WordPress, add WPGraphQL, build the ingestion adapter.</p>

<h2>Drupal + JSON:API: Structured Data Without the License Fee</h2>
<p>Drupal's content model — content types, fields, taxonomies, paragraphs — rivals AEM for structure and governance. The built-in JSON:API module (included in Drupal core since 8.7) exposes all content types with filtering, pagination, and relationship inclusion. No additional plugins required. The trade-off: Drupal has a steeper learning curve than WordPress and a smaller ecosystem.</p>
<p>Choose Drupal when you need AEM-level content structure without the AEM licensing cost, and your team can absorb the learning curve. Drupal is the answer when "we need governance, not just a REST API" but budget eliminates AEM.</p>

<h2>The RAG Equalizer</h2>
<p>If the primary consumer is an AI assistant — RAG pipeline, pgvector, LLM — all three converge. AEM GraphQL, WPGraphQL, and Drupal JSON:API all expose enough structure to build a source adapter that yields clean text chunks. The architecture that handles this cleanly treats each CMS as an interchangeable implementation of one 30-line interface. Adding a fourth CMS becomes a 60-line adapter file, not an architectural project.</p>
HTML,
];

// ── Architecture #2 ──────────────────────────────────────────────────────────
$posts[] = [
    'title'      => 'WPGraphQL vs AEM GraphQL: A Developer\'s Side-by-Side',
    'excerpt'    => 'Both AEM and WordPress support GraphQL as their headless query layer, but they take fundamentally different approaches. Having built production integrations with both, here is the comparison that matters for a Next.js front-end team.',
    'categories' => ['Architecture'],
    'tags'       => 'WPGraphQL, GraphQL, AEM, WordPress, API',
    'content'    => <<<HTML
<p>Both AEM and WordPress support GraphQL as their headless query layer, but they take fundamentally different approaches. Having built production integrations with both in the same Next.js app, here's the comparison that matters for a front-end team.</p>

<h2>Schema Generation</h2>
<p><strong>AEM:</strong> Schema is auto-generated from Content Fragment Models. You design a CF model (fields, types, references), and AEM generates the GraphQL types automatically. The schema is strongly typed and evolves with your CF model changes — but you have to design the model first, which requires planning.</p>
<p><strong>WPGraphQL:</strong> Schema is auto-generated from the WordPress data model — posts, pages, users, taxonomies, custom post types, and (with the ACF extension) custom fields. You get a working schema immediately on any WordPress site, but you're working within WP's existing data model rather than designing your own domain model.</p>

<h2>Query Execution Model</h2>
<p><strong>AEM:</strong> Persisted queries only. Named queries stored in the JCR, executed via <code>GET /graphql/execute.json/project/query-name</code>. The GET-only constraint enables full CDN caching — a major performance advantage in production. Ad-hoc POST queries are not supported outside the GraphiQL IDE.</p>
<p><strong>WPGraphQL:</strong> Both GET and POST. Ad-hoc inline queries are idiomatic — you write the query in your Next.js component file and POST it to <code>/graphql</code>. No persisted query layer unless you add WPGraphQL Smart Cache as a separate plugin. Simpler to get started; harder to cache at scale.</p>

<h2>Pagination</h2>
<p><strong>AEM:</strong> Offset-based (<code>offset</code> and <code>limit</code> arguments). Predictable for small corpora; less ideal for large datasets with frequent updates.</p>
<p><strong>WPGraphQL:</strong> Cursor-based out of the box (<code>first</code>, <code>after</code>, <code>last</code>, <code>before</code>) — the Relay connection spec. Better for large corpora and for RAG ingestion pipelines that fetch all posts with pagination.</p>

<h2>Authentication</h2>
<p><strong>AEM:</strong> Published CF content is publicly accessible via AEM Publish/Dispatcher. Draft content and Author access require token-based authentication or Basic auth. Token management for preview mode requires AEM's Service Credentials.</p>
<p><strong>WPGraphQL:</strong> Published posts are publicly readable. Draft access requires Application Passwords (WordPress core since 5.6) or JWT via plugin. The auth model is simpler — easier to set up for a side project or demo, less enterprise-grade than AEM's credential system.</p>

<h2>Verdict for Ingestion Pipelines</h2>
<p>For a RAG ingestion pipeline that re-runs regularly, AEM's persisted query + CDN caching wins at scale — no thundering herd on re-ingestion. But for an initial integration on an existing WordPress site, WPGraphQL's inline queries get you to a working adapter in an afternoon. The source adapter pattern abstracts both so your chat layer never sees the difference.</p>
HTML,
];

// ── Architecture #3 ──────────────────────────────────────────────────────────
$posts[] = [
    'title'      => 'The Source Adapter Pattern: Building CMS-Agnostic AI Ingestion Pipelines',
    'excerpt'    => 'When I extended our AEM knowledge hub to include WordPress and Drupal, the naive approach was three separate ingestion scripts. The better approach was an abstraction that makes adding a fourth CMS a 60-line exercise. That abstraction is the source adapter pattern.',
    'categories' => ['Architecture'],
    'tags'       => 'AI, RAG, Design Patterns, pgvector, TypeScript, Source Adapter',
    'content'    => <<<HTML
<p>When I extended our AEM knowledge hub to include WordPress and Drupal content, the naive approach would have been three separate ingestion scripts — one per CMS. The better approach was an abstraction that makes adding a fourth CMS a 60-line exercise. That abstraction is the source adapter pattern.</p>

<h2>The Interface</h2>
<pre><code>interface SourceAdapter {
  name: string;
  fetch(): AsyncIterable&lt;Chunk&gt;;
}</code></pre>
<p>Every CMS implementation satisfies this contract. The ingestion pipeline doesn't know or care whether it's talking to AEM GraphQL, WPGraphQL, or Drupal JSON:API — it calls <code>adapter.fetch()</code> and processes the chunks it receives.</p>

<h2>Why AsyncIterable, Not Promise&lt;Chunk[]&gt;</h2>
<p>The <code>fetch()</code> method returns an <code>AsyncIterable&lt;Chunk&gt;</code>. This matters for large corpora: an AEM instance with 10,000 Content Fragments would require loading all 10,000 into memory before embedding if you used a promise-returning interface. The async generator pattern lets the adapter yield chunks as they arrive from paginated API calls, and the pipeline batches them into 50-chunk embedding calls — constant memory pressure regardless of corpus size.</p>

<h2>The Chunk Contract</h2>
<pre><code>interface Chunk {
  path: string;      // stable upsert key, source-namespaced
  source: 'aem-cf' | 'eds' | 'wordpress' | 'drupal';
  model: string;     // content type: Article, FAQ, WPPost, DrupalCaseStudy
  chunk_type: string;
  content: string;   // plain text, HTML stripped
  metadata: Record&lt;string, unknown&gt;;
}</code></pre>
<p>The <code>path</code> field is the pgvector upsert key. Namespacing it by source (<code>wp:post:42:body:0</code>) prevents collisions when the same numeric ID appears in multiple CMSes. The <code>metadata</code> field is intentionally opaque — each source includes what it knows (categories for WP, industry taxonomy for Drupal, author refs for AEM) without changing the shared interface.</p>

<h2>Adding a New Source</h2>
<p>To add a fifth CMS tomorrow, you write one adapter file that implements <code>SourceAdapter</code>, register it in the adapter list, and run the ingestion. The chat layer, the vector store schema, the citation rendering, the streaming UI — none of them change. That's the value of the abstraction: new content sources are absorbed at the adapter boundary without propagating changes through the rest of the stack.</p>

<p>In interview terms: "I designed the ingestion pipeline so that adding a new CMS is a single adapter file — about 60 lines. The chat layer, the vector store, the citation rendering all stay unchanged." That answer separates a portfolio project from production thinking.</p>
HTML,
];

// ── DevOps #1 ────────────────────────────────────────────────────────────────
$posts[] = [
    'title'      => 'Docker-First AEM Development: A Setup That Actually Works on Windows',
    'excerpt'    => 'Setting up AEM locally on Windows has historically meant fighting with JDK versions and heap flags. Running WordPress and Drupal alongside AEM makes it harder. Here is the hybrid Docker approach that works in practice.',
    'categories' => ['DevOps'],
    'tags'       => 'Docker, AEM, Local Development, Windows, DevOps',
    'content'    => <<<HTML
<p>Setting up AEM locally on Windows has historically meant fighting with JDK versions, heap allocation flags, and PATH conflicts. Running auxiliary services — WordPress, Drupal, databases — alongside AEM Author makes it worse. Docker Compose is the answer for those auxiliary services, but AEM itself still needs to run as a bare JVM process.</p>

<h2>Why AEM Author Stays Outside Docker</h2>
<p>AEM Author uses Oak Segment Store — a memory-mapped file persistence layer that does not play well with Docker volume mounts on Windows due to file locking behavior through the Hyper-V/WSL2 file system boundary. Running AEM Author inside Docker on Windows produces unpredictable write errors under load. Lesson learned the hard way: keep AEM as a bare JAR on the Windows host.</p>

<h2>The Hybrid Stack</h2>
<ul>
  <li><strong>AEM Author (port 4502):</strong> Bare JVM — <code>java -Xmx4g -jar aem-author.jar</code> on the Windows host</li>
  <li><strong>WordPress (port 8080):</strong> Docker Compose — MySQL + WordPress image. Volume mounts for wp-content work reliably</li>
  <li><strong>Drupal (port 8081):</strong> Docker Compose — MariaDB + Drupal image</li>
  <li><strong>Next.js (port 3000):</strong> <code>npm run dev</code> on the host — hot reload without WSL2 volume latency</li>
  <li><strong>ngrok:</strong> Tunnels port 4502 to a stable public URL so Vercel can reach AEM Author</li>
</ul>

<h2>Memory Planning</h2>
<p>AEM Author needs at least 4GB heap. With WordPress and Drupal Docker containers running, you're looking at 6–8GB total RAM consumption. On a 16GB machine this leaves comfortable headroom. The JVM flags that work in practice:</p>
<pre><code>java -Xmx4g -Xms2g -XX:MaxMetaspaceSize=512m \
  -jar aem-author-p4502.jar -p 4502 -nofork</code></pre>

<h2>The Start Script</h2>
<p>A <code>start-demo.bat</code> in the project root starts everything in order and waits for AEM's cold start (about 3 minutes) before launching ngrok:</p>
<pre><code>@echo off
docker compose -f docker\wordpress\docker-compose.yml up -d
docker compose -f docker\drupal\docker-compose.yml up -d
start "AEM Author" java -Xmx4g -jar %AEM_JAR% -p 4502 -nofork
timeout /t 180
start "ngrok" ngrok http 4502 --domain=your-ngrok-domain</code></pre>

<h2>WSL2 Gotcha</h2>
<p>If you develop inside WSL2, keep your Next.js project in the WSL2 filesystem (<code>/home/user/projects/</code>), not the Windows filesystem (<code>/mnt/c/...</code>). File watching for hot reload doesn't work reliably across the WSL2/Windows boundary. AEM Author stays on the Windows side; Docker services run via Docker Desktop's WSL2 backend.</p>
HTML,
];

// ── AEP #1 ───────────────────────────────────────────────────────────────────
$posts[] = [
    'title'      => 'Connecting AEM Content Fragments to Adobe Experience Platform for Personalization',
    'excerpt'    => 'AEM Content Fragments and Adobe Experience Platform solve complementary problems: AEM structures and delivers content, AEP structures and activates customer data. The integration point is personalization — serving different CF variants based on AEP audience segments.',
    'categories' => ['AEP'],
    'tags'       => 'AEP, Adobe Experience Platform, Real-time CDP, AEM, Personalization',
    'content'    => <<<HTML
<p>AEM Content Fragments and Adobe Experience Platform solve complementary problems: AEM structures and delivers content, AEP structures and activates customer data. The integration point is personalization — serving different CF variants based on audience segments defined in AEP's Real-time Customer Profile.</p>

<h2>The Integration Architecture</h2>
<p>The standard pattern has four layers:</p>
<ol>
  <li><strong>AEP defines audiences</strong> using Real-time CDP rules — behavioral, demographic, or predictive signals from the unified profile</li>
  <li><strong>Target receives audiences</strong> via the AEP-to-Target activation flow (configured in AEP Destinations)</li>
  <li><strong>AEM sends CF variants to Target</strong> via Experience Fragments exported as HTML offers</li>
  <li><strong>Target selects the variant</strong> based on the visitor's resolved audience membership at request time</li>
</ol>
<p>The CF content itself flows AEM → Target (as XF offers). AEP's role is audience segmentation, not content delivery. Keep this boundary clear in architecture reviews — AEP is the "who is this visitor?" layer; AEM is the "what content do they see?" layer.</p>

<h2>Content Fragment Variations for Personalization</h2>
<p>AEM CF supports named Variations on a single CF — a master version plus named variants such as <code>beginner</code>, <code>expert</code>, or <code>enterprise</code>. In a GraphQL query, you can request a specific variation:</p>
<pre><code>query {
  articleByPath(
    _path: "/content/dam/kh/articles/aem-intro",
    variation: "enterprise"
  ) {
    item {
      khTitle
      khBody { html }
    }
  }
}</code></pre>
<p>When the front-end resolves the audience via AEP Web SDK and passes the variation name to the GraphQL client, you get CMS-driven personalization without Target serving the entire page.</p>

<h2>Real-Time Profile Lookup in Next.js</h2>
<p>The AEP Web SDK (<code>alloy.js</code>) resolves the visitor's edge profile and returns audience memberships on page load. In a Next.js app, this runs client-side after hydration:</p>
<pre><code>const result = await alloy('sendEvent', { xdm: { /* page view */ } });
const segments = result.propositions.flatMap(p =>
  p.items.map(i => i.id)
);
const variation = segments.includes('enterprise-audience-id')
  ? 'enterprise'
  : 'master';</code></pre>
<p>The resolved variation name then drives the CF GraphQL query client-side. For ISR-cached pages, variation can also be passed as a cookie and used as a cache key — more complex, but CDN-cacheable.</p>

<h2>What AEP Does Not Replace</h2>
<p>AEP is a customer data platform, not a CMS or a CDN. It does not deliver content — it delivers audience decisions. Content still comes from AEM. Keep this separation clear: engineers who conflate AEP and AEM in architecture discussions reveal a gap in their Adobe stack mental model that interview panels notice.</p>
HTML,
];

// ── Insert Posts ──────────────────────────────────────────────────────────────

foreach ($posts as $idx => $post) {
    // Resolve category IDs
    $resolved_cats = array_map(fn($c) => $cat_ids[$c], $post['categories']);

    $post_id = wp_insert_post([
        'post_title'   => wp_strip_all_tags($post['title']),
        'post_excerpt' => wp_strip_all_tags($post['excerpt']),
        'post_content' => $post['content'],
        'post_status'  => 'publish',
        'post_category' => $resolved_cats,
        'post_date'    => date('Y-m-d H:i:s', strtotime("-{$idx} days")),
    ], true);

    if (is_wp_error($post_id)) {
        echo "ERROR creating post '{$post['title']}': " . $post_id->get_error_message() . "\n";
        continue;
    }

    wp_set_post_tags($post_id, $post['tags']);
    echo "Created post #{$post_id}: {$post['title']}\n";
}

echo "\nSeed complete. " . count($posts) . " posts created.\n";
