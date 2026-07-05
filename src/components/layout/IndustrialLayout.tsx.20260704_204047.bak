'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardCheck,
  AlertTriangle,
  FileText,
  PackageCheck,
  ShieldCheck,
  Settings,
  X,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { SidebarProvider, useSidebar } from './SidebarContext';
import { useCurrentProfile, getInitials } from '@/lib/useCurrentProfile';

// Ítems principales que aparecen en el bottom nav (máx. 5) y en el sidebar
const primaryNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: ClipboardCheck, label: 'Inspecciones', href: '/warehouse-inspections' },
  { icon: PackageCheck, label: 'EPP', href: '/epp-deliveries' },
  { icon: AlertTriangle, label: 'Hallazgos', href: '/findings' },
  { icon: Settings, label: 'Más', href: '#more', isMore: true },
];

// Ítems secundarios que se muestran en el sidebar y en el drawer "Más" de móvil
const secondaryNavItems = [
  { icon: ShieldCheck, label: 'Inspección EPP', href: '/epp-inspections' },
  { icon: FileText, label: 'Documentos SST', href: '/documents' },
  { icon: Settings, label: 'Configuración', href: '/settings' },
];

const allNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: ClipboardCheck, label: 'Inspecciones', href: '/warehouse-inspections' },
  { icon: PackageCheck, label: 'Entrega EPP', href: '/epp-deliveries' },
  { icon: ShieldCheck, label: 'Inspección EPP', href: '/epp-inspections' },
  { icon: AlertTriangle, label: 'Hallazgos', href: '/findings' },
  { icon: FileText, label: 'Documentos SST', href: '/documents' },
  { icon: Settings, label: 'Configuración', href: '/settings' },
];

async function handleSignOut() {
  await supabase.auth.signOut();
  window.location.href = '/login';
}

// ─── Sidebar (Desktop) ───────────────────────────────────────────────────────
function DesktopSidebar() {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebar();
  const { profile, loading } = useCurrentProfile();

  return (
    <aside className={cn(
      "hidden md:flex flex-col bg-[#134686] text-white h-screen sticky top-0 shrink-0 transition-all duration-200 overflow-hidden",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo */}
      <div className={cn("p-6 border-b border-white/10 flex items-center shrink-0", collapsed ? "justify-center p-4" : "")}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#FF7F11] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="font-black text-white text-lg leading-tight truncate">ARGOS SST</div>
              <div className="text-xs text-gray-400 font-medium truncate">Sistema de Gestión</div>
            </div>
          )}
        </div>
      </div>

      {/* Nav — scrollable */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto overflow-x-hidden">
        {allNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group',
                isActive
                  ? 'bg-[#FF7F11] text-white shadow-lg shadow-orange-900/30'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white',
                collapsed ? 'justify-center' : ''
              )}
            >
              <item.icon className={cn('w-5 h-5 shrink-0', isActive ? 'text-white' : 'group-hover:text-[#FF7F11] transition-colors')} />
              {!collapsed && (
                <>
                  <span className="font-semibold text-sm whitespace-nowrap">{item.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto opacity-60 shrink-0" />}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Sidebar — fixed at bottom, never scrolls */}
      <div className="flex-none p-4 border-t border-white/10 flex flex-col gap-2 relative">
        {loading ? (
          <div className="animate-pulse bg-white/10 h-12 w-full rounded-xl" />
        ) : profile ? (
          collapsed ? (
            <div className="flex flex-col items-center gap-3">
              <div title={profile.full_name} className="w-10 h-10 rounded-full bg-[#FF7F11] flex items-center justify-center text-white font-black shrink-0 cursor-help">
                {getInitials(profile.full_name)}
              </div>
              <button onClick={handleSignOut} title="Cerrar sesión" className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
              <div className="w-10 h-10 rounded-full bg-[#FF7F11] flex items-center justify-center text-white font-black shrink-0">
                {getInitials(profile.full_name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white truncate">{profile.full_name}</p>
                <p className="text-xs text-gray-400 truncate">{profile.roles?.name ?? 'Sin rol'}</p>
              </div>
              <button onClick={handleSignOut} title="Cerrar sesión" className="p-2 shrink-0">
                <LogOut className="w-4 h-4 text-gray-400 hover:text-red-400" />
              </button>
            </div>
          )
        ) : null}

        <button
          onClick={toggle}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#134686] border border-white/10 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}

// ─── Header móvil ────────────────────────────────────────────────────────────
function MobileHeader({ onMoreClick }: { onMoreClick: () => void }) {
  const pathname = usePathname();
  const currentItem = allNavItems.find((i) => i.href === pathname);
  const pageTitle = currentItem?.label ?? 'ARGOS SST';

  return (
    <header className="md:hidden bg-[#111827] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-lg">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-[#FF7F11] flex items-center justify-center shrink-0">
          <ShieldCheck className="w-4 h-4 text-white" />
        </div>
        <span className="font-black text-base">{pageTitle}</span>
      </div>
      <button
        className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
        aria-label="Notificaciones"
      >
        <Bell className="w-5 h-5 text-gray-300" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FF7F11] rounded-full" />
      </button>
    </header>
  );
}

// ─── Bottom Nav (Móvil/Tablet) ────────────────────────────────────────────────
function BottomNav({ onMoreClick }: { onMoreClick: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#111827] border-t border-white/10 flex items-center safe-area-inset-bottom">
      {primaryNavItems.map((item) => {
        const isActive = !item.isMore && pathname === item.href;

        if (item.isMore) {
          return (
            <button
              key="more"
              onClick={onMoreClick}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-1 text-gray-500 hover:text-white transition-colors"
            >
              <item.icon className="w-6 h-6" />
              <span className="text-[10px] font-bold">Más</span>
            </button>
          );
        }

        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              'flex-1 flex flex-col items-center justify-center py-2 gap-1 transition-colors',
              isActive ? 'text-[#FF7F11]' : 'text-gray-500 hover:text-white'
            )}
          >
            <item.icon className={cn('w-6 h-6', isActive && 'drop-shadow-[0_0_6px_rgba(255,127,17,0.7)]')} />
            <span className={cn('text-[10px] font-bold', isActive ? 'text-[#FF7F11]' : '')}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

// ─── Drawer "Más" (Móvil) ────────────────────────────────────────────────────
function MobileMoreDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile, loading } = useCurrentProfile();

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Drawer panel */}
      <div
        className={cn(
          'fixed bottom-0 inset-x-0 z-50 bg-[#111827] rounded-t-2xl transform transition-transform duration-300 ease-in-out md:hidden pb-safe max-h-[85vh] flex flex-col',
          open ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <span className="font-black text-white text-sm uppercase tracking-wide">Menú completo</span>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-4 flex-1">
          {loading ? (
            <div className="animate-pulse bg-white/10 h-16 w-full rounded-xl" />
          ) : profile ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
              <div className="w-12 h-12 rounded-full bg-[#FF7F11] flex items-center justify-center text-white font-black shrink-0 text-lg">
                {getInitials(profile.full_name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold text-white truncate">{profile.full_name}</p>
                <p className="text-sm text-gray-400 truncate">{profile.roles?.name ?? 'Sin rol'}</p>
              </div>
            </div>
          ) : null}

          <div className="space-y-1">
            {secondaryNavItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={onClose}
                className="flex items-center gap-4 px-4 py-3.5 rounded-xl text-gray-300 hover:bg-white/5 hover:text-white transition-all group"
              >
                <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-[#FF7F11]/10 transition-colors">
                  <item.icon className="w-5 h-5 group-hover:text-[#FF7F11] transition-colors" />
                </div>
                <span className="font-semibold">{item.label}</span>
                <ChevronRight className="w-4 h-4 ml-auto opacity-40" />
              </Link>
            ))}
          </div>
        </div>

        <div className="px-4 pb-6 pt-2 border-t border-white/10 mx-4 shrink-0">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-4 px-4 py-3.5 w-full rounded-xl text-red-400 hover:bg-red-500/10 transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="font-semibold">Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Layout principal ─────────────────────────────────────────────────────────
function LayoutContent({ children }: { children: React.ReactNode }) {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F3F2EC] flex flex-row">
      <DesktopSidebar />

      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <MobileHeader onMoreClick={() => setMoreOpen(true)} />

        <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      <BottomNav onMoreClick={() => setMoreOpen(true)} />
      <MobileMoreDrawer open={moreOpen} onClose={() => setMoreOpen(false)} />
    </div>
  );
}

export default function IndustrialLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <LayoutContent>{children}</LayoutContent>
    </SidebarProvider>
  );
}
