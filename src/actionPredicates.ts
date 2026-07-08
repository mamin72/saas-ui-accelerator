export interface ActionPermissionContextLike {
  hasPermission(permission: string): boolean;
  hasAnyPermissions(permissions: readonly string[]): boolean;
  hasAllPermissions(permissions: readonly string[]): boolean;
}

export type ActionPermissionPredicate<TContext extends ActionPermissionContextLike = ActionPermissionContextLike> = (
  context: TContext
) => boolean;

export function andActionPredicates<TContext extends ActionPermissionContextLike>(
  ...predicates: readonly ActionPermissionPredicate<TContext>[]
): ActionPermissionPredicate<TContext> {
  return (context: TContext): boolean => predicates.every((predicate) => predicate(context));
}

export function orActionPredicates<TContext extends ActionPermissionContextLike>(
  ...predicates: readonly ActionPermissionPredicate<TContext>[]
): ActionPermissionPredicate<TContext> {
  return (context: TContext): boolean => predicates.some((predicate) => predicate(context));
}

export function notActionPredicate<TContext extends ActionPermissionContextLike>(
  predicate: ActionPermissionPredicate<TContext>
): ActionPermissionPredicate<TContext> {
  return (context: TContext): boolean => !predicate(context);
}

export function requirePermission<TContext extends ActionPermissionContextLike>(
  permission: string
): ActionPermissionPredicate<TContext> {
  return (context: TContext): boolean => context.hasPermission(permission);
}

export function requireAnyPermission<TContext extends ActionPermissionContextLike>(
  permissions: readonly string[]
): ActionPermissionPredicate<TContext> {
  return (context: TContext): boolean => context.hasAnyPermissions(permissions);
}

export function requireAllPermissions<TContext extends ActionPermissionContextLike>(
  permissions: readonly string[]
): ActionPermissionPredicate<TContext> {
  return (context: TContext): boolean => context.hasAllPermissions(permissions);
}
