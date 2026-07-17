export const roles = ['super-admin', 'administrator', 'editor', 'auditor'] as const;
export type Role = (typeof roles)[number];

export const permissions = [
  'users:read',
  'users:write',
  'news:read',
  'news:write',
  'market:read',
  'market:write',
  'procurement:read',
  'procurement:write',
  'audit:read'
] as const;

export type Permission = (typeof permissions)[number];

const rolePermissions: Record<Role, readonly Permission[]> = {
  'super-admin': permissions,
  administrator: permissions.filter((permission) => permission !== 'audit:read'),
  editor: ['news:read', 'news:write', 'market:read', 'procurement:read'],
  auditor: ['users:read', 'news:read', 'market:read', 'procurement:read', 'audit:read']
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role].includes(permission);
}
