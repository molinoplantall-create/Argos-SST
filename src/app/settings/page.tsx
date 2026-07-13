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
  ChevronDown, Eye, EyeOff, Loader2, X, Building2,
  HardHat, UserRound, Package, Upload, Pencil, Save
} from 'lucide-react';

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface UserRecord {
  id: string;
  email: string;
  fullName: string;
  role: string;
  roleId?: string | null;
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
      <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
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
      <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
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

  const handleRoleChange = async (user: UserRecord, roleId: string) => {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, roleId: roleId || null }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast(json.error || 'No se pudo cambiar el perfil.', 'error');
      return;
    }
    showToast(`Perfil de ${user.fullName} actualizado.`, 'success');
    loadUsers();
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
              <div className="flex flex-col gap-2 text-xs sm:w-56">
                <select
                  value={user.roleId ?? ''}
                  onChange={(event) => handleRoleChange(user, event.target.value)}
                  className="input-std py-2 text-xs font-bold"
                  title="Cambiar perfil"
                >
                  <option value="">Sin rol asignado</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
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
  const [editingArea, setEditingArea] = useState<any | null>(null);

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

  const handleSaveArea = async () => {
    if (!editingArea?.name?.trim()) return;
    const { error } = await supabase
      .from('areas')
      .update({
        name: editingArea.name.trim().toUpperCase(),
        description: editingArea.description?.trim() || null,
      })
      .eq('id', editingArea.id);
    if (error) {
      showToast('Error al actualizar área.', 'error');
      return;
    }
    showToast('Área actualizada.', 'success');
    setEditingArea(null);
    loadAreas();
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
            <div key={area.id} className="bg-white border border-[#DCDCDC] rounded-xl px-4 py-3 hover:border-[#FF7F11]/50 transition-colors">
              {editingArea?.id === area.id ? (
                <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_1.4fr_auto] md:items-center">
                  <input
                    value={editingArea.name ?? ''}
                    onChange={(event) => setEditingArea({ ...editingArea, name: event.target.value.toUpperCase() })}
                    className="input-std uppercase"
                  />
                  <input
                    value={editingArea.description ?? ''}
                    onChange={(event) => setEditingArea({ ...editingArea, description: event.target.value })}
                    placeholder="Descripción"
                    className="input-std"
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setEditingArea(null)} className="px-3 py-2 rounded-lg border border-[#DCDCDC] text-xs font-bold">Cancelar</button>
                    <button type="button" onClick={handleSaveArea} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-[#1E93AB] text-white text-xs font-bold">
                      <Save className="w-3 h-3" /> Guardar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-black text-[#1a1a1a] text-sm">{area.name}</p>
                    {area.description && <p className="text-xs text-gray-500">{area.description}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-[#F3F2EC] px-2.5 py-1 rounded-full font-bold text-gray-600">
                      {area.subareas?.[0]?.count ?? 0} subáreas
                    </span>
                    <button type="button" onClick={() => setEditingArea({ ...area })} className="p-2 text-[#1E93AB] hover:bg-[#1E93AB]/10 rounded-lg" title="Editar área">
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── TAB: Trabajadores ────────────────────────────────────────────────────────
function WorkersTab() {
  const { showToast, showConfirm } = useFeedback();
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ fullName: '', documentNumber: '', position: '', area: '' });
  const [adding, setAdding] = useState(false);
  const [editingWorker, setEditingWorker] = useState<any | null>(null);

  const loadWorkers = async () => {
    setLoading(true);
    const { data } = await supabase.from('workers').select('*').order('full_name');
    setWorkers(data ?? []);
    setLoading(false);
  };

  useEffect(() => { loadWorkers(); }, []);

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.documentNumber.trim()) return;
    setAdding(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('client_id').eq('id', user!.id).single();
    
    const { error } = await supabase.from('workers').insert({
      full_name: form.fullName.trim().toUpperCase(),
      document_number: form.documentNumber.trim(),
      position: form.position.trim().toUpperCase(),
      area: form.area.trim().toUpperCase(),
      client_id: (profile as any)?.client_id,
    });
    setAdding(false);
    
    if (error) {
      showToast('Error al agregar trabajador.', 'error');
    } else {
      showToast('Trabajador agregado.', 'success');
      setForm({ fullName: '', documentNumber: '', position: '', area: '' });
      loadWorkers();
    }
  };

  const handleDelete = (id: string, name: string) => {
    showConfirm({
      title: 'Eliminar Trabajador',
      message: `¿Seguro que deseas eliminar a ${name}? Esto afectará a sus entregas de EPP si existen.`,
      onConfirm: async () => {
        const { error } = await supabase.from('workers').delete().eq('id', id);
        if (error) showToast('Error al eliminar.', 'error');
        else { showToast('Trabajador eliminado.', 'success'); loadWorkers(); }
      }
    });
  };

  const handleSaveWorker = async () => {
    if (!editingWorker?.full_name?.trim() || !editingWorker?.document_number?.trim()) return;
    const { error } = await supabase
      .from('workers')
      .update({
        full_name: editingWorker.full_name.trim().toUpperCase(),
        document_number: editingWorker.document_number.trim(),
        position: editingWorker.position?.trim().toUpperCase() || null,
        area: editingWorker.area?.trim().toUpperCase() || null,
        status: editingWorker.status ?? 'ACTIVO',
      })
      .eq('id', editingWorker.id);
    if (error) {
      showToast('Error al actualizar trabajador.', 'error');
      return;
    }
    showToast('Trabajador actualizado.', 'success');
    setEditingWorker(null);
    loadWorkers();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-black text-[#134686]">Gestión de Trabajadores</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#DCDCDC] rounded-xl text-sm font-bold text-gray-600 hover:border-[#1E93AB] transition-all self-start sm:self-auto">
          <Upload className="w-4 h-4" /> Carga Masiva (Plantilla)
        </button>
      </div>

      <form onSubmit={handleAddWorker} className="bg-white border border-[#DCDCDC] p-4 rounded-xl space-y-3">
        <p className="text-sm font-bold text-[#1a1a1a]">Agregar Trabajador</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input required type="text" placeholder="DNI / Documento" value={form.documentNumber} onChange={e => setForm({...form, documentNumber: e.target.value})} className="input-std" />
          <input required type="text" placeholder="Nombre Completo" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value.toUpperCase()})} className="input-std uppercase" />
          <input type="text" placeholder="Cargo" value={form.position} onChange={e => setForm({...form, position: e.target.value.toUpperCase()})} className="input-std uppercase" />
          <input type="text" placeholder="Área" value={form.area} onChange={e => setForm({...form, area: e.target.value.toUpperCase()})} className="input-std uppercase" />
        </div>
        <button type="submit" disabled={adding} className="w-full sm:w-auto px-4 py-2.5 bg-[#1E93AB] text-white rounded-xl text-sm font-bold hover:bg-[#167082] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
          {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Agregar
        </button>
      </form>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-[#1E93AB] animate-spin" /></div>
      ) : workers.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <UserRound className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No hay trabajadores registrados.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {workers.map((worker) => (
            <div key={worker.id} className="bg-white border border-[#DCDCDC] rounded-xl px-4 py-3">
              {editingWorker?.id === worker.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
                    <input required value={editingWorker.document_number ?? ''} onChange={(event) => setEditingWorker({ ...editingWorker, document_number: event.target.value })} className="input-std" />
                    <input required value={editingWorker.full_name ?? ''} onChange={(event) => setEditingWorker({ ...editingWorker, full_name: event.target.value.toUpperCase() })} className="input-std uppercase md:col-span-2" />
                    <input value={editingWorker.position ?? ''} onChange={(event) => setEditingWorker({ ...editingWorker, position: event.target.value.toUpperCase() })} className="input-std uppercase" />
                    <input value={editingWorker.area ?? ''} onChange={(event) => setEditingWorker({ ...editingWorker, area: event.target.value.toUpperCase() })} className="input-std uppercase" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setEditingWorker(null)} className="px-3 py-2 rounded-lg border border-[#DCDCDC] text-xs font-bold">Cancelar</button>
                    <button type="button" onClick={handleSaveWorker} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-[#1E93AB] text-white text-xs font-bold">
                      <Save className="w-3 h-3" /> Guardar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-black text-[#1a1a1a] text-sm">{worker.full_name} <span className="text-xs text-gray-500 font-normal">({worker.document_number})</span></p>
                    <p className="text-xs text-gray-500">{worker.position} {worker.area && `- ${worker.area}`}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setEditingWorker({ ...worker })} className="p-2 text-[#1E93AB] hover:bg-[#1E93AB]/10 rounded-lg transition-colors" title="Editar trabajador">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(worker.id, worker.full_name)} className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Eliminar trabajador">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── TAB: Catálogo EPP ────────────────────────────────────────────────────────
function EppCatalogTab() {
  const { showToast, showConfirm } = useFeedback();
  const [catalog, setCatalog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterZone, setFilterZone] = useState('');
  const [form, setForm] = useState({ name: '', bodyZone: '', unit: 'Unidad', certification: '', unit_price: '', brand: '' });
  const [adding, setAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  const loadCatalog = async () => {
    setLoading(true);
    const { data } = await supabase.from('epp_catalog').select('*').order('name');
    setCatalog(data ?? []);
    setLoading(false);
  };

  useEffect(() => { loadCatalog(); }, []);

  const toUpper = (v: string) => v.toUpperCase();

  const filteredCatalog = filterZone
    ? catalog.filter(item => item.body_zone === filterZone)
    : catalog;

  const zones = Array.from(new Set(catalog.map(i => i.body_zone).filter(Boolean))).sort();

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.bodyZone.trim()) return;
    setAdding(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('client_id').eq('id', user!.id).single();
    const { error } = await supabase.from('epp_catalog').insert({
      name: form.name.trim().toUpperCase(),
      body_zone: form.bodyZone.trim().toUpperCase(),
      unit: form.unit.trim() || 'Unidad',
      certification: form.certification.trim().toUpperCase() || null,
      unit_price: form.unit_price ? parseFloat(form.unit_price) : null,
      brand: form.brand.trim().toUpperCase() || null,
      client_id: (profile as any)?.client_id,
    });
    setAdding(false);
    if (error) { showToast('Error al agregar EPP.', 'error'); }
    else {
      showToast('EPP agregado al catálogo.', 'success');
      setForm({ name: '', bodyZone: '', unit: 'Unidad', certification: '', unit_price: '', brand: '' });
      loadCatalog();
    }
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    setSaving(true);
    const { error } = await supabase.from('epp_catalog').update({
      name: editingItem.name?.toUpperCase(),
      body_zone: editingItem.body_zone?.toUpperCase(),
      unit: editingItem.unit,
      certification: editingItem.certification?.toUpperCase() || null,
      unit_price: editingItem.unit_price ? parseFloat(editingItem.unit_price) : null,
      brand: editingItem.brand?.toUpperCase() || null,
    }).eq('id', editingItem.id);
    setSaving(false);
    if (error) { showToast('Error al guardar.', 'error'); }
    else { showToast('EPP actualizado.', 'success'); setEditingItem(null); loadCatalog(); }
  };

  const handleDelete = (id: string, name: string) => {
    showConfirm({
      title: 'Eliminar EPP',
      message: `¿Seguro que deseas eliminar ${name}?`,
      onConfirm: async () => {
        const { error } = await supabase.from('epp_catalog').delete().eq('id', id);
        if (error) showToast('Error al eliminar.', 'error');
        else { showToast('EPP eliminado.', 'success'); loadCatalog(); }
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-black text-[#134686]">Catálogo de EPP</h2>
        <p className="text-sm text-gray-500">{filteredCatalog.length} de {catalog.length} EPPs</p>
      </div>

      {/* Formulario agregar */}
      <form onSubmit={handleAdd} className="bg-white border border-[#DCDCDC] p-4 rounded-xl space-y-3">
        <p className="text-sm font-bold text-[#1a1a1a]">Agregar EPP al catálogo</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <input required type="text" placeholder="Nombre EPP (ej: CASCO DE SEGURIDAD)" value={form.name}
            onChange={e => setForm({...form, name: toUpper(e.target.value)})} className="input-std uppercase" />
          <select required value={form.bodyZone} onChange={e => setForm({...form, bodyZone: e.target.value})} className="input-std">
            <option value="">Zona del Cuerpo *</option>
            <option value="CABEZA">CABEZA</option>
            <option value="OJOS">OJOS</option>
            <option value="OIDOS">OÍDOS</option>
            <option value="RESPIRATORIO">RESPIRATORIO</option>
            <option value="TORSO">TORSO</option>
            <option value="MANOS">MANOS</option>
            <option value="PIERNAS">PIERNAS</option>
            <option value="PIES">PIES</option>
            <option value="CUERPO COMPLETO">CUERPO COMPLETO</option>
            <option value="OTROS">OTROS</option>
          </select>
          <input type="text" placeholder="Marca (ej: 3M, HONEYWELL)" value={form.brand}
            onChange={e => setForm({...form, brand: toUpper(e.target.value)})} className="input-std uppercase" />
          <input type="text" placeholder="Unidad (ej: Unidad, Par)" value={form.unit}
            onChange={e => setForm({...form, unit: e.target.value})} className="input-std" />
          <input type="text" placeholder="Certificación (ej: ANSI Z89.1)" value={form.certification}
            onChange={e => setForm({...form, certification: toUpper(e.target.value)})} className="input-std uppercase" />
          <input type="number" min={0} step="0.01" placeholder="Precio unitario (S/)" value={form.unit_price}
            onChange={e => setForm({...form, unit_price: e.target.value})} className="input-std" />
        </div>
        <button type="submit" disabled={adding}
          className="w-full sm:w-auto px-4 py-2.5 bg-[#FF7F11] text-white rounded-xl text-sm font-bold hover:bg-[#e66f00] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
          {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Agregar al Catálogo
        </button>
      </form>

      {/* Filtro por zona */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Filtrar:</span>
        <button
          onClick={() => setFilterZone('')}
          className={cn('px-3 py-1 rounded-full text-xs font-bold transition',
            filterZone === '' ? 'bg-[#134686] text-white' : 'bg-[#F3F2EC] text-gray-600 hover:bg-[#DCDCDC]'
          )}>
          Todos ({catalog.length})
        </button>
        {zones.map(zone => (
          <button
            key={zone}
            onClick={() => setFilterZone(zone === filterZone ? '' : zone)}
            className={cn('px-3 py-1 rounded-full text-xs font-bold transition',
              filterZone === zone ? 'bg-[#1E93AB] text-white' : 'bg-[#F3F2EC] text-gray-600 hover:bg-[#DCDCDC]'
            )}>
            {zone} ({catalog.filter(i => i.body_zone === zone).length})
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-[#1E93AB] animate-spin" /></div>
      ) : filteredCatalog.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">{catalog.length === 0 ? 'El catálogo está vacío.' : 'No hay EPPs en esta zona.'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredCatalog.map((item) => (
            editingItem?.id === item.id ? (
              <div key={item.id} className="bg-white border-2 border-[#1E93AB] rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  <input type="text" value={editingItem.name || ''} placeholder="Nombre"
                    onChange={e => setEditingItem({...editingItem, name: toUpper(e.target.value)})} className="input-std uppercase" />
                  <select value={editingItem.body_zone || ''} onChange={e => setEditingItem({...editingItem, body_zone: e.target.value})} className="input-std">
                    <option value="CABEZA">CABEZA</option><option value="OJOS">OJOS</option>
                    <option value="OIDOS">OÍDOS</option><option value="RESPIRATORIO">RESPIRATORIO</option>
                    <option value="TORSO">TORSO</option><option value="MANOS">MANOS</option>
                    <option value="PIERNAS">PIERNAS</option><option value="PIES">PIES</option>
                    <option value="CUERPO COMPLETO">CUERPO COMPLETO</option><option value="OTROS">OTROS</option>
                  </select>
                  <input type="text" value={editingItem.brand || ''} placeholder="Marca"
                    onChange={e => setEditingItem({...editingItem, brand: toUpper(e.target.value)})} className="input-std uppercase" />
                  <input type="text" value={editingItem.unit || ''} placeholder="Unidad"
                    onChange={e => setEditingItem({...editingItem, unit: e.target.value})} className="input-std" />
                  <input type="text" value={editingItem.certification || ''} placeholder="Certificación"
                    onChange={e => setEditingItem({...editingItem, certification: toUpper(e.target.value)})} className="input-std uppercase" />
                  <input type="number" min={0} step="0.01" value={editingItem.unit_price ?? ''} placeholder="Precio (S/)"
                    onChange={e => setEditingItem({...editingItem, unit_price: e.target.value})} className="input-std" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditingItem(null)} className="px-3 py-1.5 border border-[#DCDCDC] rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50">Cancelar</button>
                  <button onClick={handleSaveEdit} disabled={saving}
                    className="px-3 py-1.5 bg-[#1E93AB] text-white rounded-lg text-sm font-bold hover:bg-[#167082] disabled:opacity-50 flex items-center gap-1">
                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Guardar
                  </button>
                </div>
              </div>
            ) : (
              <div key={item.id} className="flex items-center justify-between bg-white border border-[#DCDCDC] rounded-xl px-4 py-3 hover:border-[#1E93AB]/40 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-black text-[#1a1a1a] text-sm">{item.name}</p>
                    <span className="rounded-full bg-[#1E93AB]/10 px-2 py-0.5 text-[10px] font-black text-[#1E93AB]">{item.body_zone}</span>
                    {item.brand && <span className="rounded-full bg-[#F3F2EC] px-2 py-0.5 text-[10px] font-bold text-gray-600">{item.brand}</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {item.unit}
                    {item.certification && ` · ${item.certification}`}
                    {item.unit_price != null && ` · S/ ${Number(item.unit_price).toFixed(2)}`}
                    {item.created_at && ` · Agregado: ${new Date(item.created_at).toLocaleDateString('es-PE')}`}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => setEditingItem({...item})} className="p-2 text-[#1E93AB] hover:bg-[#1E93AB]/10 rounded-lg transition-colors" title="Editar">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(item.id, item.name)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg transition-colors" title="Eliminar">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PÁGINA PRINCIPAL ────────────────────────────────────────────────────────
type TabId = 'areas' | 'users' | 'workers' | 'epp_catalog' | 'system';

const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: 'areas',  label: 'Áreas de Planta', icon: Map },
  { id: 'users',  label: 'Usuarios',         icon: Users },
  { id: 'workers', label: 'Trabajadores',    icon: UserRound },
  { id: 'epp_catalog', label: 'Catálogo EPP', icon: HardHat },
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
          {activeTab === 'workers'  && <WorkersTab />}
          {activeTab === 'epp_catalog'  && <EppCatalogTab />}
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
