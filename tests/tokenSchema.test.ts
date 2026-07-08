import { describe, expect, it } from 'vitest';
import {
  assertTokenSchema,
  assertValidTokenName,
  createTokenSchema,
  defaultTokenNamingConvention,
  getTokenValue,
  resolveTokenName,
  validateTokenName,
} from '../src/index';

describe('token schema', () => {
  it('creates a typed token schema and resolves semantic aliases', () => {
    const schema = createTokenSchema({
      tokens: {
        'color.brand.primary': '#0055ff',
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

    expect(resolveTokenName(schema, 'color.brand.primary')).toBe('color.brand.primary');
    expect(resolveTokenName(schema, 'color.action.primary.background')).toBe('color.brand.primary');

    expect(getTokenValue(schema, 'color.page.background')).toBe('#ffffff');
    expect(getTokenValue(schema, 'space.scale.200')).toBe(8);
  });

  it('validates token naming convention errors', () => {
    expect(validateTokenName('', defaultTokenNamingConvention)).toEqual(['Token name must be non-empty.']);

    expect(validateTokenName('color. brand', defaultTokenNamingConvention)).toContain(
      'Token name must not include whitespace.'
    );

    expect(validateTokenName('color', defaultTokenNamingConvention)).toContain(
      "Token name 'color' must have at least 2 segments."
    );

    expect(validateTokenName('Color.brand', defaultTokenNamingConvention)).toContain(
      "Token segment 'Color' in 'Color.brand' does not match pattern /^[a-z0-9][a-z0-9-]*$/."
    );

    expect(validateTokenName('color..brand', defaultTokenNamingConvention)).toContain(
      "Token name 'color..brand' has empty segments. Separator '.' cannot appear consecutively."
    );

    expect(
      validateTokenName('color.brand.primary.default', {
        ...defaultTokenNamingConvention,
        maxSegments: 3,
      })
    ).toContain("Token name 'color.brand.primary.default' must have at most 3 segments.");
  });

  it('supports prefix-enforced conventions', () => {
    const errors = validateTokenName('shadow.overlay.100', {
      ...defaultTokenNamingConvention,
      allowedPrefixes: ['color', 'space'],
    });

    expect(errors).toContain(
      "Token name 'shadow.overlay.100' must start with one of: color, space."
    );
  });

  it('throws for invalid schema aliases and token collisions', () => {
    expect(() =>
      assertTokenSchema(
        {
          'color.brand.primary': '#0055ff',
        },
        {
          'color.alias.bad': 'color.brand.missing',
        }
      )
    ).toThrow("Semantic alias 'color.alias.bad' references unknown token 'color.brand.missing'.");

    expect(() =>
      assertTokenSchema(
        {
          'color.brand.primary': '#0055ff',
        },
        {
          'color.brand.primary': 'color.brand.primary',
        }
      )
    ).toThrow("Semantic alias 'color.brand.primary' cannot reuse an existing token name.");
  });

  it('throws actionable errors for unknown aliases or invalid names', () => {
    const schema = createTokenSchema({
      tokens: {
        'color.brand.primary': '#0055ff',
      },
      semanticAliases: {
        'color.action.primary.background': 'color.brand.primary',
      },
    });

    expect(() => resolveTokenName(schema, 'color.unknown.token')).toThrow(
      "Unknown token or semantic alias 'color.unknown.token'."
    );

    expect(() => assertValidTokenName('Color.Invalid')).toThrow(
      "Token segment 'Color' in 'Color.Invalid' does not match pattern /^[a-z0-9][a-z0-9-]*$/."
    );
  });
});
