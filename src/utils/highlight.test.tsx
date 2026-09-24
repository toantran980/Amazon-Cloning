import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { highlightText } from './highlight';

function renderText(text: string, query: string) {
  const { container } = render(<span>{highlightText(text, query)}</span>);
  return {
    marks: container.querySelectorAll('mark'),
    textContent: container.textContent ?? '',
  };
}

describe('highlightText', () => {
  it('returns the plain text when there is no query', () => {
    const { marks, textContent } = renderText('Athletic Socks', '  ');
    expect(marks.length).toBe(0);
    expect(textContent).toBe('Athletic Socks');
  });

  it('wraps the matching substring in a <mark>', () => {
    const { marks, textContent } = renderText('Athletic Cotton Socks', 'cotton');
    expect(marks.length).toBe(1);
    expect(marks[0].textContent).toBe('Cotton');
    expect(textContent).toBe('Athletic Cotton Socks');
  });

  it('matches case-insensitively while preserving original casing', () => {
    const { marks, textContent } = renderText('Athletic Cotton Socks', 'ATHLETIC');
    expect(marks.length).toBe(1);
    expect(marks[0].textContent).toBe('Athletic');
    expect(textContent).toBe('Athletic Cotton Socks');
  });

  it('highlights every occurrence of the query', () => {
    const { marks } = renderText('Sock boots and boot socks', 'sock');
    expect(marks.length).toBe(2);
  });

  it('returns the plain text when the query has no match', () => {
    const { marks, textContent } = renderText('Athletic Cotton Socks', 'toaster');
    expect(marks.length).toBe(0);
    expect(textContent).toBe('Athletic Cotton Socks');
  });
});