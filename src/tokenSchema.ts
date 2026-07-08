export type TokenValue = string | number;

export type TokenDictionary = Record<string, TokenValue>;

export type TokenAliasMap<TTokens extends TokenDictionary> = Record<string, keyof TTokens & string>;

export interface TokenNamingConvention {
  segmentSeparator: string;
  minSegments: number;
  maxSegments?: number;
  segmentPattern: RegExp;
  allowedPrefixes?: readonly string[];
}

export interface TokenSchema<
  TTokens extends TokenDictionary = TokenDictionary,
  TAliases extends TokenAliasMap<TTokens> = TokenAliasMap<TTokens>,
> {
  tokens: Readonly<TTokens>;
  semanticAliases: Readonly<TAliases>;
  namingConvention: Readonly<TokenNamingConvention>;
}

export interface TokenSchemaInput<
  TTokens extends TokenDictionary,
  TAliases extends TokenAliasMap<TTokens>,
> {
  tokens: TTokens;
  semanticAliases: TAliases;
  namingConvention?: Partial<TokenNamingConvention>;
}

export const defaultTokenNamingConvention: TokenNamingConvention = {
  segmentSeparator: '.',
  minSegments: 2,
  segmentPattern: /^[a-z0-9][a-z0-9-]*$/,
};

export function createTokenSchema<
  TTokens extends TokenDictionary,
  TAliases extends TokenAliasMap<TTokens>,
>(input: TokenSchemaInput<TTokens, TAliases>): TokenSchema<TTokens, TAliases> {
  const namingConvention = resolveNamingConvention(input.namingConvention);

  assertTokenSchema(input.tokens, input.semanticAliases, namingConvention);

  return {
    tokens: Object.freeze({ ...input.tokens }),
    semanticAliases: Object.freeze({ ...input.semanticAliases }),
    namingConvention: Object.freeze({ ...namingConvention }),
  };
}

export function resolveTokenName<
  TTokens extends TokenDictionary,
  TAliases extends TokenAliasMap<TTokens>,
>(schema: TokenSchema<TTokens, TAliases>, tokenOrAlias: string): keyof TTokens & string {
  if (tokenOrAlias in schema.tokens) {
    return tokenOrAlias;
  }

  const aliasTarget = schema.semanticAliases[tokenOrAlias];
  if (aliasTarget) {
    return aliasTarget;
  }

  throw new Error(`Unknown token or semantic alias '${tokenOrAlias}'.`);
}

export function getTokenValue<
  TTokens extends TokenDictionary,
  TAliases extends TokenAliasMap<TTokens>,
>(schema: TokenSchema<TTokens, TAliases>, tokenOrAlias: string): TokenValue {
  const resolved = resolveTokenName(schema, tokenOrAlias);
  return schema.tokens[resolved];
}

export function validateTokenName(
  tokenName: string,
  namingConvention: TokenNamingConvention = defaultTokenNamingConvention
): string[] {
  const errors: string[] = [];

  if (tokenName.trim().length === 0) {
    errors.push('Token name must be non-empty.');
    return errors;
  }

  if (/\s/.test(tokenName)) {
    errors.push('Token name must not include whitespace.');
  }

  const parts = tokenName.split(namingConvention.segmentSeparator);

  if (parts.some((part) => part.length === 0)) {
    errors.push(
      `Token name '${tokenName}' has empty segments. Separator '${namingConvention.segmentSeparator}' cannot appear consecutively.`
    );
    return errors;
  }

  if (parts.length < namingConvention.minSegments) {
    errors.push(
      `Token name '${tokenName}' must have at least ${namingConvention.minSegments} segments.`
    );
  }

  if (namingConvention.maxSegments != null && parts.length > namingConvention.maxSegments) {
    errors.push(
      `Token name '${tokenName}' must have at most ${namingConvention.maxSegments} segments.`
    );
  }

  for (const part of parts) {
    if (!namingConvention.segmentPattern.test(part)) {
      errors.push(
        `Token segment '${part}' in '${tokenName}' does not match pattern ${namingConvention.segmentPattern.toString()}.`
      );
    }
  }

  if (namingConvention.allowedPrefixes && namingConvention.allowedPrefixes.length > 0) {
    const [prefix] = parts;
    if (!namingConvention.allowedPrefixes.includes(prefix)) {
      errors.push(
        `Token name '${tokenName}' must start with one of: ${namingConvention.allowedPrefixes.join(', ')}.`
      );
    }
  }

  return errors;
}

export function assertValidTokenName(
  tokenName: string,
  namingConvention: TokenNamingConvention = defaultTokenNamingConvention
): void {
  const errors = validateTokenName(tokenName, namingConvention);
  if (errors.length > 0) {
    throw new Error(errors.join(' '));
  }
}

export function assertTokenSchema<
  TTokens extends TokenDictionary,
  TAliases extends TokenAliasMap<TTokens>,
>(
  tokens: TTokens,
  semanticAliases: TAliases,
  namingConvention: TokenNamingConvention = defaultTokenNamingConvention
): void {
  for (const tokenName of Object.keys(tokens)) {
    assertValidTokenName(tokenName, namingConvention);
  }

  for (const [aliasName, tokenName] of Object.entries(semanticAliases)) {
    assertValidTokenName(aliasName, namingConvention);

    if (!(tokenName in tokens)) {
      throw new Error(
        `Semantic alias '${aliasName}' references unknown token '${tokenName}'.`
      );
    }

    if (aliasName in tokens) {
      throw new Error(
        `Semantic alias '${aliasName}' cannot reuse an existing token name.`
      );
    }
  }
}

function resolveNamingConvention(
  overrides: Partial<TokenNamingConvention> | undefined
): TokenNamingConvention {
  if (!overrides) {
    return defaultTokenNamingConvention;
  }

  return {
    ...defaultTokenNamingConvention,
    ...overrides,
  };
}
