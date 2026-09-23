import { describe, expect, it } from 'vitest';
import { computeStatus, STATUS_TRANSITIONS } from '../src/orderStatus';

const now = Date.now();

describe('computeStatus', () => {
  it('starts as preparing', () => {
    expect(computeStatus(now)).toBe('preparing');
  });

  it('ships after the first transition window', () => {
    const elapsed = STATUS_TRANSITIONS[0].afterMs + 1000;
    expect(computeStatus(now - elapsed)).toBe('shipped');
  });

  it('delivers after the second transition window', () => {
    const elapsed = STATUS_TRANSITIONS[1].afterMs + 1000;
    expect(computeStatus(now - elapsed)).toBe('delivered');
  });

  it('respects a manually set ahead-of-time status', () => {
    expect(computeStatus(now, 'delivered')).toBe('delivered');
    expect(computeStatus(now, 'shipped')).toBe('shipped');
  });

  it('accepts bigint order dates', () => {
    expect(computeStatus(BigInt(now))).toBe('preparing');
  });
});