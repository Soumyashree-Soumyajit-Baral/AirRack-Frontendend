export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  TECH_REP: 'tech_rep',
};

export const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  tech_rep: 'Tech Rep',
};

export const ROLE_HIERARCHY = {
  super_admin: 3,
  admin: 2,
  tech_rep: 1,
};

export const ROLE_PERMISSIONS = {
  super_admin: ['manage_users', 'manage_records', 'add_records', 'view_records', 'manage_settings'],
  admin: ['manage_records', 'add_records', 'view_records', 'manage_users'],
  tech_rep: ['view_records', 'add_records'],
};
