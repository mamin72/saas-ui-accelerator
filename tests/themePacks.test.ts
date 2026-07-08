import { describe, expect, it } from 'vitest';
import {
  assertThemePacksShareAliasCoverage,
  assertThemePacksShareTokenCoverage,
  baselineThemePacks,
  createThemeResolver,
  createDirectionalTokenPair,
  createThemePack,
  resolveThemePack,
  resolveDensityModeTokens,
  resolveDirectionalTokenName,
} from '../src/index';

describe('theme packs', () => {
  it('provides baseline light, dark, and high-contrast packs', () => {
    expect(Object.keys(baselineThemePacks).sort()).toEqual(['dark', 'high-contrast', 'light']);

    expect(baselineThemePacks.light.name).toBe('light');
    expect(baselineThemePacks.dark.name).toBe('dark');
    expect(baselineThemePacks['high-contrast'].name).toBe('high-contrast');

    expect(baselineThemePacks.light.schema.tokens['color.brand.primary']).toBe('#2563eb');
    expect(baselineThemePacks.dark.schema.tokens['color.brand.primary']).toBe('#60a5fa');
    expect(baselineThemePacks['high-contrast'].schema.tokens['color.brand.primary']).toBe('#ffff00');
  });

  it('keeps token and alias coverage consistent across baseline packs', () => {
    expect(() => assertThemePacksShareTokenCoverage(baselineThemePacks)).not.toThrow();
    expect(() => assertThemePacksShareAliasCoverage(baselineThemePacks)).not.toThrow();

    const baselineAliasKey = 'color.action.primary.background';
    expect(baselineThemePacks.light.schema.semanticAliases[baselineAliasKey]).toBe('color.brand.primary');
    expect(baselineThemePacks.dark.schema.semanticAliases[baselineAliasKey]).toBe('color.brand.primary');
    expect(baselineThemePacks['high-contrast'].schema.semanticAliases[baselineAliasKey]).toBe(
      'color.brand.primary'
    );
  });

  it('detects mismatched token coverage across packs', () => {
    const brokenPacks = {
      ...baselineThemePacks,
      dark: createThemePack('dark', {
        ...baselineThemePacks.dark.schema.tokens,
        'color.debug.extra': '#ff00ff',
      }),
    };

    expect(() => assertThemePacksShareTokenCoverage(brokenPacks)).toThrow(
      "Theme 'dark' token coverage does not match baseline theme 'light'."
    );
  });

  it('detects mismatched alias coverage across packs', () => {
    const brokenPacks = {
      ...baselineThemePacks,
      dark: createThemePack('dark', baselineThemePacks.dark.schema.tokens, {
        ...baselineThemePacks.dark.schema.semanticAliases,
        'color.debug.alias': 'color.brand.primary',
      }),
    };

    expect(() => assertThemePacksShareAliasCoverage(brokenPacks)).toThrow(
      "Theme 'dark' alias coverage does not match baseline theme 'light'."
    );
  });

  it('detects missing alias keys across packs', () => {
    const remainingAliases = Object.fromEntries(
      Object.entries(baselineThemePacks.dark.schema.semanticAliases).filter(
        ([key]) => key !== 'color.page.background'
      )
    );

    const brokenPacks = {
      ...baselineThemePacks,
      dark: createThemePack('dark', baselineThemePacks.dark.schema.tokens, remainingAliases),
    };

    expect(() => assertThemePacksShareAliasCoverage(brokenPacks)).toThrow(
      "Theme 'dark' alias coverage does not match baseline theme 'light'."
    );
  });

  it('resolves density mode token layers for compact, comfortable, and spacious modes', () => {
    const compact = resolveDensityModeTokens('compact');
    const comfortable = resolveDensityModeTokens('comfortable');
    const spacious = resolveDensityModeTokens('spacious');

    expect(compact['space.component.height.control']).toBe(32);
    expect(comfortable['space.component.height.control']).toBe(36);
    expect(spacious['space.component.height.control']).toBe(42);

    expect(compact['space.component.padding-inline']).toBeLessThan(
      comfortable['space.component.padding-inline'] as number
    );
    expect(comfortable['space.component.padding-inline']).toBeLessThan(
      spacious['space.component.padding-inline'] as number
    );
  });

  it('maps directional tokens safely for ltr and rtl', () => {
    expect(resolveDirectionalTokenName(undefined, 'start', 'ltr')).toBe(
      'space.component.padding-start'
    );
    expect(resolveDirectionalTokenName(undefined, 'end', 'ltr')).toBe(
      'space.component.padding-end'
    );

    expect(resolveDirectionalTokenName(undefined, 'start', 'rtl')).toBe(
      'space.component.padding-end'
    );
    expect(resolveDirectionalTokenName(undefined, 'end', 'rtl')).toBe(
      'space.component.padding-start'
    );

    const rtlPair = createDirectionalTokenPair(undefined, 'rtl');
    expect(rtlPair).toEqual({
      inlineStart: 'space.component.padding-end',
      inlineEnd: 'space.component.padding-start',
    });
  });

  it('resolves theme packs with default and fallback behavior', () => {
    expect(resolveThemePack(undefined).name).toBe('light');
    expect(resolveThemePack('dark').name).toBe('dark');
    expect(resolveThemePack('unknown-theme').name).toBe('light');
    expect(resolveThemePack('unknown-theme', { fallbackTheme: 'high-contrast' }).name).toBe(
      'high-contrast'
    );
  });

  it('supports resolver utility with strict and fallback modes', () => {
    const resolver = createThemeResolver(baselineThemePacks, { fallbackTheme: 'dark' });

    expect(resolver.getDefaultThemeName()).toBe('dark');
    expect(resolver.isSupported('light')).toBe(true);
    expect(resolver.isSupported('custom')).toBe(false);

    expect(resolver.resolve(undefined).name).toBe('dark');
    expect(resolver.resolve('light').name).toBe('light');
    expect(resolver.resolve('custom').name).toBe('dark');

    expect(() => resolver.resolve('custom', { fallbackMode: 'throw' })).toThrow(
      "Unknown theme 'custom'. Supported themes: light, dark, high-contrast."
    );
  });
});
