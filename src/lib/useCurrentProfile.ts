'use client';

import { useEffect, useState } from 'react';
import { supabase } from './supabase';

type Profile = {
  id: string;
  full_name: string;
  roles?: {
    name: string;
  } | null;
};

export function useCurrentProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (mounted) setLoading(false);
          return;
        }

        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, roles(name)')
          .eq('id', user.id)
          .single();

        if (mounted) {
          setProfile(data as unknown as Profile);
        }
      } catch (err) {
        console.error('Failed to load profile', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  return { profile, loading };
}

export function getInitials(name?: string) {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
