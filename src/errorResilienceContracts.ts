export type ErrorBoundaryScope = 'global' | 'route' | 'page' | 'component';

export type FallbackSeverity = 'info' | 'warning' | 'error' | 'fatal';

export interface ErrorBoundaryContract {
  boundaryKey: string;
  scope: ErrorBoundaryScope;
  fallbackViewKey: string;
  captureErrorTypes: readonly string[];
  tags: readonly string[];
  rethrowInDevelopment: boolean;
}

export interface FallbackViewContract {
  viewKey: string;
  title: string;
  message: string;
  severity: FallbackSeverity;
  allowRetry: boolean;
  supportReferenceId?: string;
}

export type ErrorResilienceReasonCode = 'boundary-not-registered' | 'fallback-view-not-registered';

export interface ErrorResilienceReason {
  code: ErrorResilienceReasonCode;
  message: string;
}

export interface ErrorBoundaryResolution {
  boundaryKey: string;
  fallbackViewKey?: string;
  boundary?: ErrorBoundaryContract;
  fallbackView?: FallbackViewContract;
  resolved: boolean;
  reasons: readonly ErrorResilienceReason[];
}

export function createErrorBoundaryContract(input: {
  boundaryKey: string;
  scope?: ErrorBoundaryScope;
  fallbackViewKey: string;
  captureErrorTypes?: readonly string[];
  tags?: readonly string[];
  rethrowInDevelopment?: boolean;
}): ErrorBoundaryContract {
  const boundaryKey = input.boundaryKey.trim();
  if (boundaryKey.length === 0) {
    throw new Error('Error boundary contract key must be non-empty.');
  }

  const fallbackViewKey = input.fallbackViewKey.trim();
  if (fallbackViewKey.length === 0) {
    throw new Error('Fallback view key must be non-empty for an error boundary contract.');
  }

  return {
    boundaryKey,
    scope: input.scope ?? 'component',
    fallbackViewKey,
    captureErrorTypes: normalizeList(input.captureErrorTypes),
    tags: normalizeList(input.tags),
    rethrowInDevelopment: input.rethrowInDevelopment ?? false,
  };
}

export function createFallbackViewContract(input: {
  viewKey: string;
  title: string;
  message: string;
  severity?: FallbackSeverity;
  allowRetry?: boolean;
  supportReferenceId?: string;
}): FallbackViewContract {
  const viewKey = input.viewKey.trim();
  if (viewKey.length === 0) {
    throw new Error('Fallback view contract key must be non-empty.');
  }

  const title = input.title.trim();
  if (title.length === 0) {
    throw new Error('Fallback view title must be non-empty.');
  }

  const message = input.message.trim();
  if (message.length === 0) {
    throw new Error('Fallback view message must be non-empty.');
  }

  const supportReferenceId = input.supportReferenceId?.trim();

  return {
    viewKey,
    title,
    message,
    severity: input.severity ?? 'error',
    allowRetry: input.allowRetry ?? true,
    supportReferenceId: supportReferenceId && supportReferenceId.length > 0 ? supportReferenceId : undefined,
  };
}

export function createErrorResilienceRegistry(input: {
  boundaries: readonly ErrorBoundaryContract[];
  fallbackViews: readonly FallbackViewContract[];
}): {
  hasBoundary(boundaryKey: string): boolean;
  hasFallbackView(viewKey: string): boolean;
  listBoundaryKeys(): readonly string[];
  listFallbackViewKeys(): readonly string[];
  resolveFallback(boundaryKey: string): ErrorBoundaryResolution;
} {
  const boundaries = new Map<string, ErrorBoundaryContract>();
  const fallbackViews = new Map<string, FallbackViewContract>();

  for (const boundary of input.boundaries) {
    boundaries.set(boundary.boundaryKey, boundary);
  }

  for (const fallbackView of input.fallbackViews) {
    fallbackViews.set(fallbackView.viewKey, fallbackView);
  }

  return {
    hasBoundary(boundaryKey: string): boolean {
      return boundaries.has(boundaryKey.trim());
    },
    hasFallbackView(viewKey: string): boolean {
      return fallbackViews.has(viewKey.trim());
    },
    listBoundaryKeys(): readonly string[] {
      return Array.from(boundaries.keys()).sort((left, right) => left.localeCompare(right));
    },
    listFallbackViewKeys(): readonly string[] {
      return Array.from(fallbackViews.keys()).sort((left, right) => left.localeCompare(right));
    },
    resolveFallback(boundaryKey: string): ErrorBoundaryResolution {
      const normalizedBoundaryKey = boundaryKey.trim();
      const boundary = boundaries.get(normalizedBoundaryKey);

      if (!boundary) {
        return {
          boundaryKey: normalizedBoundaryKey,
          resolved: false,
          reasons: [
            {
              code: 'boundary-not-registered',
              message: `No error boundary contract is registered for '${normalizedBoundaryKey}'.`,
            },
          ],
        };
      }

      const fallbackView = fallbackViews.get(boundary.fallbackViewKey);
      if (!fallbackView) {
        return {
          boundaryKey: boundary.boundaryKey,
          fallbackViewKey: boundary.fallbackViewKey,
          boundary,
          resolved: false,
          reasons: [
            {
              code: 'fallback-view-not-registered',
              message: `No fallback view contract is registered for '${boundary.fallbackViewKey}'.`,
            },
          ],
        };
      }

      return {
        boundaryKey: boundary.boundaryKey,
        fallbackViewKey: fallbackView.viewKey,
        boundary,
        fallbackView,
        resolved: true,
        reasons: [],
      };
    },
  };
}

function normalizeList(values?: readonly string[]): readonly string[] {
  if (!values) {
    return [];
  }

  const normalized = values.map((value) => value.trim()).filter((value) => value.length > 0);
  return Array.from(new Set(normalized));
}
