'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  ClipboardCheck, 
  AlertTriangle, 
  FileText, 
  PackageCheck,
  ShieldCheck,
  Settings, 
  Menu, 
  X,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: ClipboardCheck, label: 'Inspecciones', href: '/warehouse-inspections' },
  { icon: PackageCheck, label: 'Entrega EPP', href: '/epp-deliveries' },
  { icon: ShieldCheck, label: 'Inspección EPP', href: '/epp-inspections' },
  { icon: AlertTriangle, label: 'Hallazgos', href: '/findings' },
  { icon: FileText, label: 'Documentos SST', href: '/documents' },
  { icon: Settings, label: 'Configuración', href: '/settings' },
];

export default function IndustrialLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F3F2EC] flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden bg-[#1a1a1a] text-white p-4 flex justify-between items-center">
        <div className="font-bold text-[#FF7F11]">ARGOS SST</div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </header>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-[#1a1a1a] text-white transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6">
          <div className="text-2xl font-bold text-[#FF7F11] mb-8">ARGOS SST</div>
          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-[#333] transition-colors group"
                onClick={() => setIsSidebarOpen(false)}
              >
                <item.icon className="w-5 h-5 group-hover:text-[#FF7F11] transition-colors" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="absolute bottom-0 w-full p-6 border-t border-[#333]">
          <button 
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = '/login';
            }}
            className="flex items-center space-x-3 text-gray-400 hover:text-white transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
