import { describe, expect, it } from 'vitest';
import {
  andActionPredicates,
  notActionPredicate,
  orActionPredicates,
  requireAllPermissions,
  requireAnyPermission,
  requirePermission,
  type ActionPermissionContextLike,
} from '../src/actionPredicates';

const createContext = (permissions: readonly string[]): ActionPermissionContextLike => {
  const set = new Set(permissions);
  return {
    hasPermission: (permission) => set.has(permission),
    hasAnyPermissions: (required) => required.some((permission) => set.has(permission)),
    hasAllPermissions: (required) => required.every((permission) => set.has(permission)),
  };
};

describe('actionPredicates', () => {
  it('evaluates single permission checks', () => {
    const context = createContext(['users:view', 'users:edit']);

    expect(requirePermission('users:view')(context)).toBe(true);
    expect(requirePermission('users:delete')(context)).toBe(false);
  });

  it('evaluates any/all permission requirements', () => {
    const context = createContext(['users:view', 'users:edit']);

    expect(requireAnyPermission(['users:archive', 'users:view'])(context)).toBe(true);
    expect(requireAnyPermission(['users:archive', 'users:delete'])(context)).toBe(false);
    expect(requireAllPermissions(['users:view', 'users:edit'])(context)).toBe(true);
    expect(requireAllPermissions(['users:view', 'users:delete'])(context)).toBe(false);
  });

  it('composes predicates with and/or/not', () => {
    const context = createContext(['users:view', 'users:archive']);
    const canView = requirePermission('users:view');
    const canArchive = requirePermission('users:archive');
    const canDelete = requirePermission('users:delete');

    expect(andActionPredicates(canView, canArchive)(context)).toBe(true);
    expect(andActionPredicates(canView, canDelete)(context)).toBe(false);
    expect(orActionPredicates(canDelete, canArchive)(context)).toBe(true);
    expect(notActionPredicate(canDelete)(context)).toBe(true);
  });
});
