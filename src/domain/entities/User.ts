export type RoleName = 'SUPERADMIN' | 'ADMIN_SST' | 'INSPECTOR' | 'SUPERVISOR' | 'VISUALIZADOR';

export interface IPermission {
  module: string;
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'SIGN' | 'APPROVE';
}

export interface IRole {
  id: string;
  name: RoleName;
  permissions: IPermission[];
}

export interface IUserProfile {
  id: string;
  fullName: string;
  email: string;
  role: IRole;
  signatureUrl?: string;
  isActive: boolean;
}

export class UserProfile implements IUserProfile {
  constructor(
    public id: string,
    public fullName: string,
    public email: string,
    public role: IRole,
    public isActive: boolean = true,
    public signatureUrl?: string
  ) {}

  can(module: string, action: IPermission['action']): boolean {
    if (this.role.name === 'SUPERADMIN') return true;
    return this.role.permissions.some(p => p.module === module && p.action === action);
  }
}
