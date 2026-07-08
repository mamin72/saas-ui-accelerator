import { describe, expect, it } from 'vitest';
import {
  baselineThemePacks,
  createDirectionalTokenPair,
  createThemeResolver,
  createTokenSchema,
  getTokenValue,
  resolveDensityModeTokens,
  resolveThemePack,
  resolveTokenName,
} from '../src/index';

describe('foundation track 1 integration', () => {
  it('combines token schema, theme packs, density layers, and resolver flows', () => {
    const schema = createTokenSchema({
      tokens: {
        'color.brand.primary': '#2563eb',
        'color.surface.canvas': '#ffffff',
        'space.scale.200': 8,
      },
      semanticAliases: {
        'color.action.primary.background': 'color.brand.primary',
        'color.page.background': 'color.surface.canvas',
      },
      namingConvention: {
        allowedPrefixes: ['color', 'space'],
      },
    });

    expect(resolveTokenName(schema, 'color.action.primary.background')).toBe('color.brand.primary');
    expect(getTokenValue(schema, 'color.page.background')).toBe('#ffffff');

    const resolver = createThemeResolver(baselineThemePacks, { fallbackTheme: 'dark' });

    const selectedTheme = resolver.resolve('light');
    const fallbackTheme = resolver.resolve('unknown-theme');

    expect(selectedTheme.name).toBe('light');
    expect(fallbackTheme.name).toBe('dark');

    const compactDensity = resolveDensityModeTokens('compact');
    const spaciousDensity = resolveDensityModeTokens('spacious');

    expect(compactDensity['space.component.height.control']).toBeLessThan(
      spaciousDensity['space.component.height.control'] as number
    );

    const ltrPair = createDirectionalTokenPair(undefined, 'ltr');
    const rtlPair = createDirectionalTokenPair(undefined, 'rtl');

    expect(ltrPair.inlineStart).toBe('space.component.padding-start');
    expect(rtlPair.inlineStart).toBe('space.component.padding-end');

    const activeThemePack = resolveThemePack('high-contrast');
    expect(getTokenValue(activeThemePack.schema, 'color.page.background')).toBe('#000000');
  });

  it('supports strict resolver mode for unsupported themes', () => {
    const resolver = createThemeResolver(baselineThemePacks, {
      fallbackTheme: 'light',
      fallbackMode: 'throw',
    });

    expect(() => resolver.resolve('experimental-theme')).toThrow(
      "Unknown theme 'experimental-theme'. Supported themes: light, dark, high-contrast."
    );
  });
});
