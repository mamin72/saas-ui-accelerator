import {
  createTokenSchema,
  type TokenAliasMap,
  type TokenDictionary,
  type TokenSchema,
} from './tokenSchema';

export type ThemeName = 'light' | 'dark' | 'high-contrast';
export type DensityMode = 'compact' | 'comfortable' | 'spacious';
export type TextDirection = 'ltr' | 'rtl';

export interface DirectionalTokenMap {
  start: string;
  end: string;
}

export interface ThemePack<
  TTokens extends TokenDictionary = TokenDictionary,
  TAliases extends TokenAliasMap<TTokens> = TokenAliasMap<TTokens>,
> {
  name: ThemeName;
  schema: TokenSchema<TTokens, TAliases>;
}

export interface DensityModeTokenLayer {
  mode: DensityMode;
  tokens: TokenDictionary;
}

const baseSemanticAliases = {
  'color.page.background': 'color.surface.canvas',
  'color.page.text': 'color.text.primary',
  'color.card.background': 'color.surface.elevated',
  'color.card.border': 'color.border.default',
  'color.action.primary.background': 'color.brand.primary',
  'color.action.primary.text': 'color.text.inverse',
  'color.input.border.default': 'color.border.default',
  'color.input.border.focus': 'color.focus.ring',
} as const;

const defaultThemeNamingConvention = {
  allowedPrefixes: ['color', 'space', 'radius', 'opacity'],
} as const;

const defaultDensityModeTokenLayers = {
  compact: {
    'space.component.padding-inline': 8,
    'space.component.padding-block': 6,
    'space.component.gap.inline': 6,
    'space.component.gap.block': 6,
    'space.component.height.control': 32,
  },
  comfortable: {
    'space.component.padding-inline': 12,
    'space.component.padding-block': 8,
    'space.component.gap.inline': 8,
    'space.component.gap.block': 8,
    'space.component.height.control': 36,
  },
  spacious: {
    'space.component.padding-inline': 16,
    'space.component.padding-block': 12,
    'space.component.gap.inline': 12,
    'space.component.gap.block': 12,
    'space.component.height.control': 42,
  },
} satisfies Record<DensityMode, TokenDictionary>;

const defaultDirectionalTokenMap = {
  start: 'space.component.padding-start',
  end: 'space.component.padding-end',
} as const;

export function createThemePack<
  TTokens extends TokenDictionary,
  TAliases extends TokenAliasMap<TTokens> = TokenAliasMap<TTokens>,
>(name: ThemeName, tokens: TTokens, semanticAliases?: TAliases): ThemePack<TTokens, TAliases> {
  const aliases = (semanticAliases ?? baseSemanticAliases) as TAliases;

  return {
    name,
    schema: createTokenSchema({
      tokens,
      semanticAliases: aliases,
      namingConvention: defaultThemeNamingConvention,
    }),
  };
}

export function createBaselineThemePacks(): Record<ThemeName, ThemePack> {
  const light = createThemePack('light', {
    'color.surface.canvas': '#ffffff',
    'color.surface.elevated': '#f8fafc',
    'color.text.primary': '#111827',
    'color.text.inverse': '#ffffff',
    'color.border.default': '#d1d5db',
    'color.focus.ring': '#2563eb',
    'color.brand.primary': '#2563eb',
    'color.status.success': '#16a34a',
    'color.status.warning': '#d97706',
    'color.status.danger': '#dc2626',
    'space.scale.100': 4,
    'space.scale.200': 8,
    'space.scale.300': 12,
    'radius.scale.100': 4,
    'radius.scale.200': 8,
    'opacity.disabled.100': 0.5,
  });

  const dark = createThemePack('dark', {
    'color.surface.canvas': '#0b1220',
    'color.surface.elevated': '#111a2e',
    'color.text.primary': '#f3f4f6',
    'color.text.inverse': '#0b1220',
    'color.border.default': '#334155',
    'color.focus.ring': '#60a5fa',
    'color.brand.primary': '#60a5fa',
    'color.status.success': '#4ade80',
    'color.status.warning': '#f59e0b',
    'color.status.danger': '#f87171',
    'space.scale.100': 4,
    'space.scale.200': 8,
    'space.scale.300': 12,
    'radius.scale.100': 4,
    'radius.scale.200': 8,
    'opacity.disabled.100': 0.55,
  });

  const highContrast = createThemePack('high-contrast', {
    'color.surface.canvas': '#000000',
    'color.surface.elevated': '#0a0a0a',
    'color.text.primary': '#ffffff',
    'color.text.inverse': '#000000',
    'color.border.default': '#ffffff',
    'color.focus.ring': '#00ffff',
    'color.brand.primary': '#ffff00',
    'color.status.success': '#00ff00',
    'color.status.warning': '#ffff00',
    'color.status.danger': '#ff0033',
    'space.scale.100': 4,
    'space.scale.200': 8,
    'space.scale.300': 12,
    'radius.scale.100': 4,
    'radius.scale.200': 8,
    'opacity.disabled.100': 0.6,
  });

  const packs = {
    light,
    dark,
    'high-contrast': highContrast,
  } satisfies Record<ThemeName, ThemePack>;

  assertThemePacksShareTokenCoverage(packs);
  assertThemePacksShareAliasCoverage(packs);

  return packs;
}

export const baselineThemePacks = Object.freeze(createBaselineThemePacks());

export const baselineDensityModeLayers = Object.freeze(
  createBaselineDensityModeLayers()
);

export function assertThemePacksShareTokenCoverage(themePacks: Record<ThemeName, ThemePack>): void {
  const [firstName, ...restNames] = Object.keys(themePacks) as ThemeName[];
  const baselineTokenKeys = sortedKeys(themePacks[firstName].schema.tokens);

  for (const name of restNames) {
    const candidateTokenKeys = sortedKeys(themePacks[name].schema.tokens);
    const differences = diffKeys(baselineTokenKeys, candidateTokenKeys);

    if (differences.length > 0) {
      throw new Error(
        `Theme '${name}' token coverage does not match baseline theme '${firstName}'. Differences: ${differences.join(', ')}.`
      );
    }
  }
}

export function assertThemePacksShareAliasCoverage(themePacks: Record<ThemeName, ThemePack>): void {
  const [firstName, ...restNames] = Object.keys(themePacks) as ThemeName[];
  const baselineAliasKeys = sortedKeys(themePacks[firstName].schema.semanticAliases);

  for (const name of restNames) {
    const candidateAliasKeys = sortedKeys(themePacks[name].schema.semanticAliases);
    const differences = diffKeys(baselineAliasKeys, candidateAliasKeys);

    if (differences.length > 0) {
      throw new Error(
        `Theme '${name}' alias coverage does not match baseline theme '${firstName}'. Differences: ${differences.join(', ')}.`
      );
    }
  }
}

export function createBaselineDensityModeLayers(): Record<DensityMode, DensityModeTokenLayer> {
  return {
    compact: {
      mode: 'compact',
      tokens: Object.freeze({ ...defaultDensityModeTokenLayers.compact }),
    },
    comfortable: {
      mode: 'comfortable',
      tokens: Object.freeze({ ...defaultDensityModeTokenLayers.comfortable }),
    },
    spacious: {
      mode: 'spacious',
      tokens: Object.freeze({ ...defaultDensityModeTokenLayers.spacious }),
    },
  };
}

export function resolveDensityModeTokens(
  mode: DensityMode,
  layers: Record<DensityMode, DensityModeTokenLayer> = baselineDensityModeLayers
): TokenDictionary {
  return layers[mode].tokens;
}

export function resolveDirectionalTokenName(
  map: DirectionalTokenMap = defaultDirectionalTokenMap,
  side: 'start' | 'end',
  direction: TextDirection
): string {
  if (direction === 'ltr') {
    return side === 'start' ? map.start : map.end;
  }

  return side === 'start' ? map.end : map.start;
}

export function createDirectionalTokenPair(
  map: DirectionalTokenMap = defaultDirectionalTokenMap,
  direction: TextDirection
): { inlineStart: string; inlineEnd: string } {
  return {
    inlineStart: resolveDirectionalTokenName(map, 'start', direction),
    inlineEnd: resolveDirectionalTokenName(map, 'end', direction),
  };
}

function sortedKeys(dictionary: TokenDictionary): string[] {
  return Object.keys(dictionary).sort((a, b) => a.localeCompare(b));
}

function diffKeys(expected: string[], actual: string[]): string[] {
  const expectedSet = new Set(expected);
  const actualSet = new Set(actual);
  const differences: string[] = [];

  for (const key of expected) {
    if (!actualSet.has(key)) {
      differences.push(`missing:${key}`);
    }
  }

  for (const key of actual) {
    if (!expectedSet.has(key)) {
      differences.push(`extra:${key}`);
    }
  }

  return differences;
}
