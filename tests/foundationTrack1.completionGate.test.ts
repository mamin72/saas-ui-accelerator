import { describe, expect, it } from 'vitest';
import * as foundation from '../src/index';

describe('foundation track 1 completion gate', () => {
  it('exposes all expected public APIs for track 1 deliverables', () => {
    expect(typeof foundation.createTokenSchema).toBe('function');
    expect(typeof foundation.resolveTokenName).toBe('function');
    expect(typeof foundation.getTokenValue).toBe('function');
    expect(typeof foundation.validateTokenName).toBe('function');

    expect(typeof foundation.createBaselineThemePacks).toBe('function');
    expect(typeof foundation.baselineThemePacks).toBe('object');
    expect(typeof foundation.resolveDensityModeTokens).toBe('function');
    expect(typeof foundation.resolveDirectionalTokenName).toBe('function');
    expect(typeof foundation.createDirectionalTokenPair).toBe('function');

    expect(typeof foundation.resolveThemePack).toBe('function');
    expect(typeof foundation.createThemeResolver).toBe('function');
  });

  it('validates integrated runtime behavior through public exports', () => {
    const schema = foundation.createTokenSchema({
      tokens: {
        'color.brand.primary': '#2563eb',
        'color.surface.canvas': '#ffffff',
      },
      semanticAliases: {
        'color.action.primary.background': 'color.brand.primary',
      },
      namingConvention: {
        allowedPrefixes: ['color'],
      },
    });

    const resolvedName = foundation.resolveTokenName(schema, 'color.action.primary.background');
    expect(resolvedName).toBe('color.brand.primary');

    const resolver = foundation.createThemeResolver(foundation.baselineThemePacks, {
      fallbackTheme: 'dark',
    });

    const selectedTheme = resolver.resolve('high-contrast');
    const fallbackTheme = resolver.resolve('invalid-theme');

    expect(selectedTheme.name).toBe('high-contrast');
    expect(fallbackTheme.name).toBe('dark');

    const compact = foundation.resolveDensityModeTokens('compact');
    const directional = foundation.createDirectionalTokenPair(undefined, 'rtl');

    expect(compact['space.component.height.control']).toBe(32);
    expect(directional.inlineStart).toBe('space.component.padding-end');

    expect(foundation.getTokenValue(selectedTheme.schema, 'color.page.background')).toBe('#000000');
  });
});
