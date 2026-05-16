/* AEM Knowledge Hub — drop-in AI chat widget
 * Usage: <script src="https://aem-headless-nextjs.vercel.app/embed.js"
 *                 data-source="wordpress" data-tenant="acme" async></script>
 *
 * Attributes:
 *   data-source   Content source scope: wordpress | drupal | aem-cf | eds (default: wordpress)
 *   data-tenant   Your tenant identifier for multi-tenant scoping (default: demo)
 */
(function () {
  'use strict';

  var script = document.currentScript;
  if (!script) return;

  var source = script.dataset.source || 'wordpress';
  var tenant = script.dataset.tenant || 'demo';
  var origin = new URL(script.src).origin;

  // Build the iframe — transparent, fixed bottom-right, starts at button size (80×80)
  var iframe = document.createElement('iframe');
  iframe.src = origin + '/chat-embed'
    + '?source=' + encodeURIComponent(source)
    + '&tenant=' + encodeURIComponent(tenant);
  iframe.title = 'AI Knowledge Assistant';
  iframe.allow = 'clipboard-write';
  iframe.setAttribute('scrolling', 'no');
  iframe.setAttribute('frameborder', '0');
  // bottom:0 / right:0 so the inner widget's own bottom-6 right-6 offsets take effect
  iframe.style.cssText = [
    'position:fixed',
    'bottom:0',
    'right:0',
    'width:80px',
    'height:80px',
    'border:0',
    'background:transparent',
    'z-index:2147483647',
    'transition:width 0.25s ease,height 0.25s ease',
    'overflow:hidden',
  ].join(';');

  // Append once DOM is ready
  if (document.body) {
    document.body.appendChild(iframe);
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      document.body.appendChild(iframe);
    });
  }

  // Resize the iframe when the widget opens or closes
  // The ChatWidget sends: { type: 'chat-toggle', open: boolean }
  // Open size: w-96 (384px) + right-6 (24px) = 408px wide
  //            h-[540px]  + bottom-6 (24px) = 564px tall
  window.addEventListener('message', function (e) {
    if (e.origin !== origin) return;
    if (!e.data || e.data.type !== 'chat-toggle') return;
    if (e.data.open) {
      iframe.style.width = '408px';
      iframe.style.height = '564px';
    } else {
      iframe.style.width = '80px';
      iframe.style.height = '80px';
    }
  });
})();
