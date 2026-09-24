import type { ReactNode } from 'react';

// Highlights query matches inside <mark> elements so search results show where
// the text matched. Safe against HTML-injection: slicing raw text keeps the
// product name inert, only <mark> wrappers are added.
export function highlightText(text: string, query?: string): ReactNode[] {
  const trimmed = query?.trim() ?? '';
  if (!trimmed) return [text];

  const q = trimmed.toLowerCase();
  const lower = text.toLowerCase();
  const parts: ReactNode[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const index = lower.indexOf(q, cursor);
    if (index === -1) {
      parts.push(text.slice(cursor));
      break;
    }
    if (index > cursor) parts.push(text.slice(cursor, index));
    parts.push(
      <mark key={index} className="bg-yellow-200">
        {text.slice(index, index + q.length)}
      </mark>
    );
    cursor = index + q.length;
  }

  return parts;
}