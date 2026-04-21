'use client';

import { useState } from 'react';
import { FaqModel } from '@/types/aem';

function FAQItem({ item }: { item: FaqModel }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left bg-white hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-gray-900 pr-4">{item.khQuestion}</span>
        <span className="text-gray-400 text-xl flex-shrink-0">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div
          className="px-5 py-4 bg-gray-50 border-t border-gray-200 prose prose-sm prose-gray max-w-none"
          dangerouslySetInnerHTML={{ __html: item.khAnswer?.html ?? '' }}
        />
      )}
    </div>
  );
}

export default function FAQAccordion({ items }: { items: FaqModel[] }) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <FAQItem key={item._path} item={item} />
      ))}
    </div>
  );
}
