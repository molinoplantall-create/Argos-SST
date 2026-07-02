'use client';

import { useCurrentProfile } from './useCurrentProfile';

export function useIsAdmin(): boolean {
  const { profile } = useCurrentProfile();
  if (!profile?.roles) return false;
  
  const roleName = Array.isArray(profile.roles) 
    ? profile.roles[0]?.name 
    : (profile.roles as any).name;

  return ['SUPERADMIN', 'ADMIN_SST'].includes(roleName ?? '');
}
