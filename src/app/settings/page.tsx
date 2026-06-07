'use client';

import React, { useEffect, useState, useCallback } from 'react';
import IndustrialLayout from '@/components/layout/IndustrialLayout';
import { supabase } from '@/lib/supabase';
import { seedInitialData } from '@/lib/seedData';
import { useFeedback } from '@/components/common/FeedbackUI';
import { cn } from '@/lib/utils';
import {
  Settings as SettingsIcon, Map, Users, Database,
  AlertCircle, RefreshCw, Plus, Trash2, KeyRound,
  Shield, User, Mail, CheckCircle2, XCircle,
  ChevronDown, Eye, EyeOff, Loader2, X, Building2
} from 'lucide-react';

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface UserRecord {
  id: string;
  email: string;
  fullName: string;
  role: string;
  roleDescription: string;
  position: string;
  area: string;
  isActive: boolean;
  emailConfirmed: boolean;
  lastSignIn: string | null;
  createdAt: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
}

// ─── MODAL: Crear Usuario ─────────────────────────────────────────────────────
function CreateUserModal({ roles, onClose, onCreated }: {
  roles: Role[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const { showToast } = useFeedback();
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
    roleId: '', position: '', area: ''
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sugerir email según nombre
  const handleNameChange = (name: string) => {
    const suggestion = name.trim().toLowerCase()
      .replace(/\s+/g, '.')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    setForm((f) => ({
      ...f,
      fullName: name,
      email: f.email || `${suggestion}@argos.com`,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      showToast('Las contraseñas no coinciden.', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          fullName: form.fullName,
          roleId: form.roleId || null,
          position: form.position,
          area: form.area,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      showToast(`Usuario "${form.fullName}" creado con éxito.`, 'success');
      onCreated();
      onClose();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#DCDCDC] bg-[#F3F2EC] rounded-t-2xl">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#1E93AB] rounded-lg flex items-center justify-center">
                <Plus className="w-4 h-4 text-white" />
              </div>
              <h2 className="font-black text-[#134686]">Nuevo Usuario</h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#DCDCDC] transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <Field label="Nombre completo" required>
              <input
                type="text" required placeholder="Luis Campa"
                value={form.fullName}
                onChange={(e) => handleNameChange(e.target.value)}
                className="input-std"
              />
            </Field>

            <Field label="Correo" required>
              <input
                type="email" required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="luis@argos.com"
                className="input-std"
              />
            </Field>

            <Field label="Contraseña" required>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} required
                  value={form.password} minLength={8}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Mínimo 8 caracteres"
                  className="input-std pr-11"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>

            <Field label="Confirmar contraseña" required>
              <input
                type="password" required
                value={form.confirmPassword}
                onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                placeholder="Repetir contraseña"
                className="input-std"
              />
            </Field>

            <Field label="Rol">
              <select
                value={form.roleId}
                onChange={(e) => setForm((f) => ({ ...f, roleId: e.target.value }))}
                className="input-std"
              >
                <option value="">Sin rol asignado</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name} — {r.description}</option>
                ))}
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Cargo">
                <input type="text" value={form.position}
                  onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
                  placeholder="Inspector SST" className="input-std" />
              </Field>
              <Field label="Área">
                <input type="text" value={form.area}
                  onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
                  placeholder="Seguridad" className="input-std" />
              </Field>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 border border-[#DCDCDC] rounded-xl text-sm font-bold hover:bg-[#F3F2EC] transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 py-2.5 bg-[#1E93AB] text-white rounded-xl text-sm font-bold hover:bg-[#167082] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Crear Usuario
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

// ─── MODAL: Cambiar Contraseña ────────────────────────────────────────────────
function ChangePasswordModal({ user, onClose }: { user: UserRecord; onClose: () => void }) {
  const { showToast } = useFeedback();
  const [pw, setPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw !== confirmPw) { showToast('Las contraseñas no coinciden.', 'error'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, password: pw }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      showToast('Contraseña actualizada con éxito.', 'success');
      onClose();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#DCDCDC] bg-[#F3F2EC] rounded-t-2xl">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-[#FF7F11]" />
              <h2 className="font-black text-[#134686]">Cambiar Contraseña</h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#DCDCDC]"><X className="w-5 h-5 text-gray-500" /></button>
          </div>
          <div className="px-6 py-4 bg-orange-50 border-b border-orange-100">
            <p className="text-sm font-bold text-orange-800">{user.fullName}</p>
            <p className="text-xs text-orange-600">{user.email}</p>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <Field label="Nueva contraseña" required>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} required minLength={8}
                  value={pw} onChange={(e) => setPw(e.target.value)}
                  placeholder="Mínimo 8 caracteres" className="input-std pr-11" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>
            <Field label="Confirmar contraseña" required>
              <input type="password" required minLength={8}
                value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="Repetir contraseña" className="input-std" />
            </Field>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 border border-[#DCDCDC] rounded-xl text-sm font-bold hover:bg-[#F3F2EC] transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 py-2.5 bg-[#FF7F11] text-white rounded-xl text-sm font-bold hover:bg-[#e66f00] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Guardar
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

// ─── Helper Component ────────────────────────────────────────────────────────
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-[11px] font-black uppercase tracking-widest text-gray-500">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

// ─── TAB: Gestión de Usuarios ─────────────────────────────────────────────────
function UsersTab() {
  const { showToast, showConfirm } = useFeedback();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [changePwUser, setChangePwUser] = useState<UserRecord | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const [usersRes, rolesRes] = await Promise.all([
      fetch('/api/admin/users'),
      supabase.from('roles').select('id, name, description').order('name'),
    ]);

    if (usersRes.ok) {
      const json = await usersRes.json();
      setUsers(json.users ?? []);
    } else {
      const json = await usersRes.json();
      showToast(json.error || 'No tienes permisos para ver usuarios.', 'error');
    }

    if (!rolesRes.error) setRoles(rolesRes.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleDelete = (user: UserRecord) => {
    showConfirm({
      title: 'Eliminar usuario',
      message: `¿Seguro que deseas eliminar a "${user.fullName}" (${user.email})? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        const res = await fetch('/api/admin/users', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        });
        const json = await res.json();
        if (!res.ok) { showToast(json.error, 'error'); return; }
        showToast(`Usuario "${user.fullName}" eliminado.`, 'success');
        loadUsers();
      },
    });
  };

  const handleToggleActive = async (user: UserRecord) => {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, isActive: !user.isActive }),
    });
    if (res.ok) {
      showToast(`Usuario ${!user.isActive ? 'activado' : 'desactivado'}.`, 'success');
      loadUsers();
    }
  };

  const ROLE_COLOR: Record<string, string> = {
    SUPERADMIN: 'bg-purple-100 text-purple-800',
    ADMIN_SST: 'bg-blue-100 text-blue-800',
    INSPECTOR: 'bg-teal-100 text-teal-800',
    SUPERVISOR: 'bg-orange-100 text-orange-800',
    GERENCIA: 'bg-indigo-100 text-indigo-800',
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-[#134686]">Usuarios del Sistema</h2>
          <p className="text-sm text-gray-500">{users.length} usuario{users.length !== 1 ? 's' : ''} registrado{users.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1E93AB] text-white rounded-xl text-sm font-bold hover:bg-[#167082] transition-all shadow-sm self-start sm:self-auto">
          <Plus className="w-4 h-4" /> Nuevo Usuario
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3">
          <Loader2 className="w-6 h-6 text-[#1E93AB] animate-spin" />
          <span className="text-sm text-gray-500">Cargando usuarios...</span>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((user) => (
            <div key={user.id}
              className="bg-white border border-[#DCDCDC] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-[#1E93AB]/40 transition-colors">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1E93AB] to-[#134686] flex items-center justify-center text-white font-black text-sm shrink-0">
                {user.fullName.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-black text-[#1a1a1a] text-sm">{user.fullName}</span>
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-black',
                    ROLE_COLOR[user.role] ?? 'bg-gray-100 text-gray-600'
                  )}>
                    {user.role}
                  </span>
                  {!user.isActive && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-700">INACTIVO</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                  <Mail className="w-3 h-3" />{user.email}
                </p>
                {(user.position || user.area) && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {[user.position, user.area].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>

              {/* Indicadores */}
              <div className="flex items-center gap-2 text-xs">
                <span aria-label={user.emailConfirmed ? 'Email confirmado' : 'Email no confirmado'}>
                  {user.emailConfirmed
                    ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                    : <XCircle className="w-4 h-4 text-gray-300" />
                  }
                </span>
                {user.lastSignIn && (
                  <span className="text-gray-400 hidden sm:inline">
                    Último: {new Date(user.lastSignIn).toLocaleDateString('es-PE')}
                  </span>
                )}
              </div>

              {/* Acciones */}
              <div className="flex gap-2 shrink-0">
                <button onClick={() => handleToggleActive(user)}
                  title={user.isActive ? 'Desactivar' : 'Activar'}
                  className={cn(
                    'p-2 rounded-lg border text-xs font-bold transition-all',
                    user.isActive
                      ? 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100'
                      : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                  )}>
                  {user.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                </button>
                <button onClick={() => setChangePwUser(user)}
                  title="Cambiar contraseña"
                  className="p-2 rounded-lg border border-[#DCDCDC] bg-white text-gray-500 hover:border-[#FF7F11] hover:text-[#FF7F11] transition-all">
                  <KeyRound className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(user)}
                  title="Eliminar usuario"
                  className="p-2 rounded-lg border border-[#DCDCDC] bg-white text-gray-500 hover:border-red-400 hover:text-red-500 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateUserModal roles={roles} onClose={() => setShowCreate(false)} onCreated={loadUsers} />
      )}
      {changePwUser && (
        <ChangePasswordModal user={changePwUser} onClose={() => setChangePwUser(null)} />
      )}
    </div>
  );
}

// ─── TAB: Áreas ───────────────────────────────────────────────────────────────
function AreasTab() {
  const { showToast, showConfirm } = useFeedback();
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [newArea, setNewArea] = useState('');
  const [adding, setAdding] = useState(false);

  const loadAreas = async () => {
    setLoading(true);
    const { data } = await supabase.from('areas').select('*, subareas(count)').order('name');
    setAreas(data ?? []);
    setLoading(false);
  };

  useEffect(() => { loadAreas(); }, []);

  const handleSeed = () => {
    showConfirm({
      title: 'Inicializar Datos Maestros',
      message: 'Cargará áreas, subáreas y tipos de inspección iniciales. ¿Continuar?',
      onConfirm: async () => {
        setSeeding(true);
        const result = await seedInitialData();
        setSeeding(false);
        if (result.success) { showToast('¡Datos maestros inicializados!', 'success'); loadAreas(); }
        else showToast(`Error: ${result.error}`, 'error');
      },
    });
  };

  const handleAddArea = async () => {
    if (!newArea.trim()) return;
    setAdding(true);
    // Obtener client_id del perfil actual
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('client_id').eq('id', user!.id).single();
    const { error } = await supabase.from('areas').insert({
      name: newArea.trim().toUpperCase(),
      client_id: (profile as any)?.client_id,
    });
    setAdding(false);
    if (error) showToast('Error al agregar área.', 'error');
    else { showToast('Área agregada.', 'success'); setNewArea(''); loadAreas(); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-black text-[#134686]">Gestión de Áreas</h2>
        <button onClick={handleSeed} disabled={seeding}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-[#DCDCDC] rounded-xl text-sm font-bold text-gray-600 hover:border-[#1E93AB] transition-all disabled:opacity-50 self-start sm:self-auto">
          {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
          Inicializar Datos Maestros
        </button>
      </div>

      {/* Agregar área */}
      <div className="flex gap-2">
        <input type="text" value={newArea} onChange={(e) => setNewArea(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddArea()}
          placeholder="Nombre del área nueva..."
          className="flex-1 px-4 py-2.5 text-sm border border-[#DCDCDC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E93AB]" />
        <button onClick={handleAddArea} disabled={adding || !newArea.trim()}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1E93AB] text-white rounded-xl text-sm font-bold hover:bg-[#167082] transition-all disabled:opacity-50">
          {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Agregar
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-[#1E93AB] animate-spin" /></div>
      ) : areas.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No hay áreas configuradas.</p>
          <p className="text-xs mt-1">Usa "Inicializar Datos Maestros" o agrega una manualmente.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {areas.map((area) => (
            <div key={area.id} className="flex items-center justify-between bg-white border border-[#DCDCDC] rounded-xl px-4 py-3 hover:border-[#FF7F11]/50 transition-colors">
              <div>
                <p className="font-black text-[#1a1a1a] text-sm">{area.name}</p>
                {area.description && <p className="text-xs text-gray-500">{area.description}</p>}
              </div>
              <span className="text-xs bg-[#F3F2EC] px-2.5 py-1 rounded-full font-bold text-gray-600">
                {area.subareas?.[0]?.count ?? 0} subáreas
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PÁGINA PRINCIPAL ────────────────────────────────────────────────────────
type TabId = 'areas' | 'users' | 'system';

const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: 'areas',  label: 'Áreas de Planta', icon: Map },
  { id: 'users',  label: 'Usuarios',         icon: Users },
  { id: 'system', label: 'Sistema',           icon: Database },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('users');

  return (
    <IndustrialLayout>
      <div className="space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-[#1a1a1a] flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-[#FF7F11]" /> Configuración
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Administración del sistema ARGOS SST</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-white border border-[#DCDCDC] rounded-xl p-1 gap-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold transition-all',
                activeTab === id
                  ? 'bg-[#134686] text-white shadow-sm'
                  : 'text-gray-500 hover:text-[#134686] hover:bg-[#F3F2EC]'
              )}>
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Contenido de la tab activa */}
        <div>
          {activeTab === 'areas'  && <AreasTab />}
          {activeTab === 'users'  && <UsersTab />}
          {activeTab === 'system' && (
            <div className="card-industrial text-center py-16 space-y-3 text-gray-400">
              <Database className="w-12 h-12 mx-auto opacity-30" />
              <p className="font-bold">Configuración del sistema</p>
              <p className="text-sm">Aquí irán ajustes avanzados: branding, notificaciones, integraciones.</p>
            </div>
          )}
        </div>
      </div>
    </IndustrialLayout>
  );
}
