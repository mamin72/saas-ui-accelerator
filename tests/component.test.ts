import { describe, expect, it } from 'vitest';
import { allComponentKitNames, component, createEnabledComponent, sortUsingComponent } from '../src/index';

describe('component namespace', () => {
  it('provides auth and billing kit capabilities', () => {
    const auth = component.authKit.createContext({
      tenantId: 't1',
      userId: 'u1',
      roles: ['admin'],
      permissions: ['billing:manage'],
    });

    const hasEntitlement = component.billingKit.createEntitlementChecker({
      features: ['analytics', 'workflows'],
    });

    expect(auth.hasRole('admin')).toBe(true);
    expect(auth.hasPermission('billing:manage')).toBe(true);
    expect(hasEntitlement('analytics')).toBe(true);
    expect(hasEntitlement('inbox')).toBe(false);
  });

  it('applies default empty roles and permissions in auth kit', () => {
    const auth = component.authKit.createContext({
      tenantId: 't2',
      userId: 'u2',
    });

    expect(auth.roles).toEqual([]);
    expect(auth.permissions).toEqual([]);
    expect(auth.hasRole('admin')).toBe(false);
    expect(auth.hasPermission('billing:manage')).toBe(false);
  });

  it('supports data grid operations via unified namespace', () => {
    const sorted = sortUsingComponent(
      [
        { name: 'B', score: 2 },
        { name: 'A', score: 1 },
      ],
      [{ id: 'name', direction: 'asc', selector: (row) => row.name }]
    );

    expect(sorted.map((row) => row.name)).toEqual(['A', 'B']);

    const table = component.dataGridPro.createTable({
      data: [{ id: 'u1', name: 'Alice' }],
      columns: [{ key: 'name', header: 'Name', dataType: 'text' }],
      rowKey: 'id',
    });

    expect(table.getTableRows()[0]?.cells[0]?.displayValue).toBe('Alice');
  });

  it('supports kebab-case aliases using string keys', () => {
    expect(component['auth-kit']).toBe(component.authKit);
    expect(component['billing-kit']).toBe(component.billingKit);
    expect(component['data-grid-pro']).toBe(component.dataGridPro);
  });

  it('provides remaining kit helpers', () => {
    expect(component.tenantOrgKit.canAccessTenant({ tenantId: 't1', allowedTenantIds: ['t1'] })).toBe(true);
    expect(component.formsValidationKit.validateRequired({ name: '', age: 1 }, ['name', 'age'])).toEqual(['name']);

    const rule = component.workflowAutomationUi.createRule('on-create', ['send-email']);
    expect(rule).toEqual({ trigger: 'on-create', actions: ['send-email'] });

    expect(component.analyticsDashboardKit.createKpiCard('MRR', 1200, 10)).toEqual({
      label: 'MRR',
      value: 1200,
      delta: 10,
    });

    expect(
      component.notificationsInboxKit.unreadCount([
        { id: '1', title: 'A', read: false, createdAt: '2026-01-01T00:00:00.000Z' },
        { id: '2', title: 'B', read: true, createdAt: '2026-01-01T00:00:00.000Z' },
      ])
    ).toBe(1);

    expect(component.adminOpsConsoleKit.isFeatureEnabled({ beta: true }, 'beta')).toBe(true);
    expect(component.adminOpsConsoleKit.isFeatureEnabled({ beta: true }, 'other')).toBe(false);

    expect(component.onboardingAdoptionKit.completionRatio([true, false, true])).toBeCloseTo(2 / 3, 5);
    expect(component.onboardingAdoptionKit.completionRatio([])).toBe(0);

    expect(component.foundationPrimitives.supportedTracks.length).toBe(5);
  });

  it('enables all kits by default in createEnabledComponent', () => {
    const runtime = createEnabledComponent();

    expect(runtime.enabledKits.size).toBe(allComponentKitNames.length);
    for (const kitName of allComponentKitNames) {
      expect(runtime.isEnabled(kitName)).toBe(true);
    }

    const auth = runtime.component.authKit.createContext({ tenantId: 't1', userId: 'u1' });
    expect(auth.userId).toBe('u1');
  });

  it('allows progressive roadmap enablement and blocks disabled kits', () => {
    const runtime = createEnabledComponent({
      enabledKits: ['data-grid-pro', 'foundation-primitives'],
    });

    expect(runtime.isEnabled('data-grid-pro')).toBe(true);
    expect(runtime.isEnabled('auth-kit')).toBe(false);

    const table = runtime.component.dataGridPro.createTable({
      data: [{ id: '1', name: 'Alice' }],
      columns: [{ key: 'name', header: 'Name', dataType: 'text' }],
      rowKey: 'id',
    });

    expect(table.getTableRows()[0]?.cells[0]?.displayValue).toBe('Alice');
    expect(() => runtime.component.authKit.createContext({ tenantId: 't1', userId: 'u1' })).toThrow(
      "Kit 'auth-kit' is disabled. Enable it in createEnabledComponent()."
    );
    expect(() => runtime.component['billing-kit'].createEntitlementChecker({ features: [] })).toThrow(
      "Kit 'billing-kit' is disabled. Enable it in createEnabledComponent()."
    );
  });
});
