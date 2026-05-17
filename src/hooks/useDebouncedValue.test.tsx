import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useDebouncedValue } from './useDebouncedValue';

describe('useDebouncedValue', () => {
  it('updates only after delay', () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(
      ({ value, delayMs }: { value: string; delayMs: number }) =>
        useDebouncedValue(value, delayMs),
      {
        initialProps: { value: 'a', delayMs: 300 },
      }
    );

    rerender({ value: 'ab', delayMs: 300 });
    expect(result.current).toBe('a');

    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(result.current).toBe('a');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('ab');

    vi.useRealTimers();
  });
});