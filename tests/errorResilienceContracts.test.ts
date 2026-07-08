import { describe, expect, it } from 'vitest';
import {
  createErrorBoundaryContract,
  createErrorResilienceRegistry,
  createFallbackViewContract,
} from '../src/index';

describe('error resilience contracts', () => {
  it('creates normalized error boundary contracts', () => {
    const contract = createErrorBoundaryContract({
      boundaryKey: ' users.page ',
      fallbackViewKey: ' default.error ',
      captureErrorTypes: ['network', 'network', ' '],
      tags: ['critical', 'critical', 'frontend'],
      rethrowInDevelopment: true,
    });

    expect(contract.boundaryKey).toBe('users.page');
    expect(contract.scope).toBe('component');
    expect(contract.fallbackViewKey).toBe('default.error');
    expect(contract.captureErrorTypes).toEqual(['network']);
    expect(contract.tags).toEqual(['critical', 'frontend']);
    expect(contract.rethrowInDevelopment).toBe(true);
  });

  it('rejects empty error boundary key', () => {
    expect(() =>
      createErrorBoundaryContract({
        boundaryKey: '  ',
        fallbackViewKey: 'default.error',
      })
    ).toThrow('Error boundary contract key must be non-empty.');
  });

  it('rejects empty fallback view key for boundary', () => {
    expect(() =>
      createErrorBoundaryContract({
        boundaryKey: 'users.page',
        fallbackViewKey: '  ',
      })
    ).toThrow('Fallback view key must be non-empty for an error boundary contract.');
  });

  it('creates normalized fallback view contracts', () => {
    const fallback = createFallbackViewContract({
      viewKey: ' default.error ',
      title: ' Something went wrong ',
      message: ' Try again in a moment. ',
      supportReferenceId: '  ERR-001  ',
    });

    expect(fallback.viewKey).toBe('default.error');
    expect(fallback.title).toBe('Something went wrong');
    expect(fallback.message).toBe('Try again in a moment.');
    expect(fallback.severity).toBe('error');
    expect(fallback.allowRetry).toBe(true);
    expect(fallback.supportReferenceId).toBe('ERR-001');
  });

  it('supports explicit scope and fallback rendering options', () => {
    const boundary = createErrorBoundaryContract({
      boundaryKey: 'global.boundary',
      scope: 'global',
      fallbackViewKey: 'global.fallback',
    });

    const fallback = createFallbackViewContract({
      viewKey: 'global.fallback',
      title: 'Global error',
      message: 'Please refresh.',
      severity: 'fatal',
      allowRetry: false,
      supportReferenceId: '   ',
    });

    expect(boundary.scope).toBe('global');
    expect(fallback.severity).toBe('fatal');
    expect(fallback.allowRetry).toBe(false);
    expect(fallback.supportReferenceId).toBeUndefined();
  });

  it('rejects empty fallback view key', () => {
    expect(() =>
      createFallbackViewContract({
        viewKey: ' ',
        title: 'valid',
        message: 'valid',
      })
    ).toThrow('Fallback view contract key must be non-empty.');
  });

  it('rejects empty fallback titles and messages', () => {
    expect(() =>
      createFallbackViewContract({
        viewKey: 'default.error',
        title: ' ',
        message: 'valid',
      })
    ).toThrow('Fallback view title must be non-empty.');

    expect(() =>
      createFallbackViewContract({
        viewKey: 'default.error',
        title: 'valid',
        message: ' ',
      })
    ).toThrow('Fallback view message must be non-empty.');
  });

  it('resolves boundary and fallback mappings through registry', () => {
    const registry = createErrorResilienceRegistry({
      boundaries: [
        createErrorBoundaryContract({
          boundaryKey: 'users.page',
          fallbackViewKey: 'default.error',
        }),
      ],
      fallbackViews: [
        createFallbackViewContract({
          viewKey: 'default.error',
          title: 'Something went wrong',
          message: 'Try again.',
        }),
      ],
    });

    expect(registry.hasBoundary('users.page')).toBe(true);
    expect(registry.hasFallbackView('default.error')).toBe(true);
    expect(registry.listBoundaryKeys()).toEqual(['users.page']);
    expect(registry.listFallbackViewKeys()).toEqual(['default.error']);

    const result = registry.resolveFallback('users.page');
    expect(result.resolved).toBe(true);
    expect(result.reasons).toEqual([]);
    expect(result.boundary?.boundaryKey).toBe('users.page');
    expect(result.fallbackView?.viewKey).toBe('default.error');
  });

  it('returns deny metadata when boundary is not registered', () => {
    const registry = createErrorResilienceRegistry({
      boundaries: [],
      fallbackViews: [],
    });

    const result = registry.resolveFallback('missing.boundary');
    expect(result.resolved).toBe(false);
    expect(result.reasons.map((reason) => reason.code)).toEqual(['boundary-not-registered']);
  });

  it('returns deny metadata when fallback view is not registered', () => {
    const registry = createErrorResilienceRegistry({
      boundaries: [
        createErrorBoundaryContract({
          boundaryKey: 'users.page',
          fallbackViewKey: 'missing.fallback',
        }),
      ],
      fallbackViews: [],
    });

    const result = registry.resolveFallback('users.page');
    expect(result.resolved).toBe(false);
    expect(result.reasons.map((reason) => reason.code)).toEqual(['fallback-view-not-registered']);
  });

  it('returns sorted boundary and fallback keys for multiple entries', () => {
    const registry = createErrorResilienceRegistry({
      boundaries: [
        createErrorBoundaryContract({
          boundaryKey: 'z.page',
          fallbackViewKey: 'z.fallback',
        }),
        createErrorBoundaryContract({
          boundaryKey: 'a.page',
          fallbackViewKey: 'a.fallback',
        }),
      ],
      fallbackViews: [
        createFallbackViewContract({
          viewKey: 'z.fallback',
          title: 'Z fallback',
          message: 'z',
        }),
        createFallbackViewContract({
          viewKey: 'a.fallback',
          title: 'A fallback',
          message: 'a',
        }),
      ],
    });

    expect(registry.listBoundaryKeys()).toEqual(['a.page', 'z.page']);
    expect(registry.listFallbackViewKeys()).toEqual(['a.fallback', 'z.fallback']);
  });
});
