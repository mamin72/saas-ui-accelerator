import { parseAndSort } from './formatSupport';
import { JsonTableComponent, type JsonTableComponentOptions } from './tableComponent';
import { sortByRules, type SortRule } from './sortByRules';

export interface AuthContext {
  readonly tenantId: string;
  readonly userId: string;
  readonly roles: readonly string[];
  readonly permissions: readonly string[];
  hasRole(role: string): boolean;
  hasPermission(permission: string): boolean;
}

export interface EntitlementInput {
  readonly features: readonly string[];
}

export interface TenantAccessInput {
  readonly tenantId: string;
  readonly allowedTenantIds: readonly string[];
}

export interface WorkflowRule {
  readonly trigger: string;
  readonly actions: readonly string[];
}

export interface KpiCard {
  readonly label: string;
  readonly value: number;
  readonly delta?: number;
}

export interface InboxItem {
  readonly id: string;
  readonly title: string;
  readonly read: boolean;
  readonly createdAt: string;
}

export const allComponentKitNames = [
  'auth-kit',
  'billing-kit',
  'tenant-org-kit',
  'data-grid-pro',
  'forms-validation-kit',
  'workflow-automation-ui',
  'analytics-dashboard-kit',
  'notifications-inbox-kit',
  'admin-ops-console-kit',
  'onboarding-adoption-kit',
  'foundation-primitives',
] as const;

export type ComponentKitName = (typeof allComponentKitNames)[number];

export interface ComponentEnablementOptions {
  readonly enabledKits?: readonly ComponentKitName[];
}

export const authKit = {
  createContext(input: {
    tenantId: string;
    userId: string;
    roles?: readonly string[];
    permissions?: readonly string[];
  }): AuthContext {
    const roles = input.roles ?? [];
    const permissions = input.permissions ?? [];

    return {
      tenantId: input.tenantId,
      userId: input.userId,
      roles,
      permissions,
      hasRole: (role: string): boolean => roles.includes(role),
      hasPermission: (permission: string): boolean => permissions.includes(permission),
    };
  },
};

export const billingKit = {
  createEntitlementChecker(input: EntitlementInput): (feature: string) => boolean {
    const features = new Set(input.features);
    return (feature: string): boolean => features.has(feature);
  },
};

export const tenantOrgKit = {
  canAccessTenant(input: TenantAccessInput): boolean {
    return input.allowedTenantIds.includes(input.tenantId);
  },
};

export const dataGridPro = {
  createTable<T extends Record<string, unknown>>(options: JsonTableComponentOptions<T>): JsonTableComponent<T> {
    return new JsonTableComponent(options);
  },
  sortByRules,
  parseAndSort,
};

export const formsValidationKit = {
  validateRequired<T extends Record<string, unknown>>(model: T, requiredFields: readonly (keyof T)[]): string[] {
    return requiredFields
      .filter((field) => {
        const value = model[field];
        return value == null || (typeof value === 'string' && value.trim().length === 0);
      })
      .map((field) => String(field));
  },
};

export const workflowAutomationUi = {
  createRule(trigger: string, actions: readonly string[]): WorkflowRule {
    return { trigger, actions };
  },
};

export const analyticsDashboardKit = {
  createKpiCard(label: string, value: number, delta?: number): KpiCard {
    return { label, value, delta };
  },
};

export const notificationsInboxKit = {
  unreadCount(items: readonly InboxItem[]): number {
    return items.filter((item) => !item.read).length;
  },
};

export const adminOpsConsoleKit = {
  isFeatureEnabled(flags: Readonly<Record<string, boolean>>, flagName: string): boolean {
    return flags[flagName] ?? false;
  },
};

export const onboardingAdoptionKit = {
  completionRatio(steps: readonly boolean[]): number {
    if (steps.length === 0) {
      return 0;
    }

    const completed = steps.filter(Boolean).length;
    return completed / steps.length;
  },
};

export const foundationPrimitives = {
  supportedTracks: [
    'design-tokens-and-theming',
    'data-and-state-primitives',
    'access-control-primitives',
    'error-and-resilience-primitives',
    'internationalization-and-localization',
  ] as const,
};

export const component = {
  authKit,
  billingKit,
  tenantOrgKit,
  dataGridPro,
  formsValidationKit,
  workflowAutomationUi,
  analyticsDashboardKit,
  notificationsInboxKit,
  adminOpsConsoleKit,
  onboardingAdoptionKit,
  foundationPrimitives,
  // Kebab-case aliases for string-key access: component['auth-kit']
  'auth-kit': authKit,
  'billing-kit': billingKit,
  'tenant-org-kit': tenantOrgKit,
  'data-grid-pro': dataGridPro,
  'forms-validation-kit': formsValidationKit,
  'workflow-automation-ui': workflowAutomationUi,
  'analytics-dashboard-kit': analyticsDashboardKit,
  'notifications-inbox-kit': notificationsInboxKit,
  'admin-ops-console-kit': adminOpsConsoleKit,
  'onboarding-adoption-kit': onboardingAdoptionKit,
  'foundation-primitives': foundationPrimitives,
} as const;

export type ComponentNamespace = typeof component;

export interface EnabledComponentNamespace {
  readonly component: ComponentNamespace;
  readonly enabledKits: ReadonlySet<ComponentKitName>;
  isEnabled(kitName: ComponentKitName): boolean;
}

function createDisabledKitProxy<TKit extends object>(kitName: ComponentKitName): TKit {
  return new Proxy(
    {},
    {
      get(): never {
        throw new Error(`Kit '${kitName}' is disabled. Enable it in createEnabledComponent().`);
      },
    }
  ) as TKit;
}

function normalizeEnabledKits(enabledKits?: readonly ComponentKitName[]): ReadonlySet<ComponentKitName> {
  if (enabledKits == null) {
    return new Set(allComponentKitNames);
  }

  return new Set(enabledKits);
}

function resolveKit<TKit extends object>(
  kitName: ComponentKitName,
  enabled: ReadonlySet<ComponentKitName>,
  kit: TKit
): TKit {
  if (enabled.has(kitName)) {
    return kit;
  }

  return createDisabledKitProxy<TKit>(kitName);
}

export function createEnabledComponent(options: ComponentEnablementOptions = {}): EnabledComponentNamespace {
  const enabledKits = normalizeEnabledKits(options.enabledKits);

  const enabledComponent: ComponentNamespace = {
    authKit: resolveKit('auth-kit', enabledKits, authKit),
    billingKit: resolveKit('billing-kit', enabledKits, billingKit),
    tenantOrgKit: resolveKit('tenant-org-kit', enabledKits, tenantOrgKit),
    dataGridPro: resolveKit('data-grid-pro', enabledKits, dataGridPro),
    formsValidationKit: resolveKit('forms-validation-kit', enabledKits, formsValidationKit),
    workflowAutomationUi: resolveKit('workflow-automation-ui', enabledKits, workflowAutomationUi),
    analyticsDashboardKit: resolveKit('analytics-dashboard-kit', enabledKits, analyticsDashboardKit),
    notificationsInboxKit: resolveKit('notifications-inbox-kit', enabledKits, notificationsInboxKit),
    adminOpsConsoleKit: resolveKit('admin-ops-console-kit', enabledKits, adminOpsConsoleKit),
    onboardingAdoptionKit: resolveKit('onboarding-adoption-kit', enabledKits, onboardingAdoptionKit),
    foundationPrimitives: resolveKit('foundation-primitives', enabledKits, foundationPrimitives),
    'auth-kit': resolveKit('auth-kit', enabledKits, authKit),
    'billing-kit': resolveKit('billing-kit', enabledKits, billingKit),
    'tenant-org-kit': resolveKit('tenant-org-kit', enabledKits, tenantOrgKit),
    'data-grid-pro': resolveKit('data-grid-pro', enabledKits, dataGridPro),
    'forms-validation-kit': resolveKit('forms-validation-kit', enabledKits, formsValidationKit),
    'workflow-automation-ui': resolveKit('workflow-automation-ui', enabledKits, workflowAutomationUi),
    'analytics-dashboard-kit': resolveKit('analytics-dashboard-kit', enabledKits, analyticsDashboardKit),
    'notifications-inbox-kit': resolveKit('notifications-inbox-kit', enabledKits, notificationsInboxKit),
    'admin-ops-console-kit': resolveKit('admin-ops-console-kit', enabledKits, adminOpsConsoleKit),
    'onboarding-adoption-kit': resolveKit('onboarding-adoption-kit', enabledKits, onboardingAdoptionKit),
    'foundation-primitives': resolveKit('foundation-primitives', enabledKits, foundationPrimitives),
  } as const;

  return {
    component: enabledComponent,
    enabledKits,
    isEnabled: (kitName: ComponentKitName): boolean => enabledKits.has(kitName),
  };
}

export function sortUsingComponent<TItem>(items: readonly TItem[], rules: readonly SortRule<TItem>[]): readonly TItem[] {
  return component.dataGridPro.sortByRules(items, rules);
}
