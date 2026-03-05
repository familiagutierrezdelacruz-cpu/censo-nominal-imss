import React, { useState, useEffect } from 'react';
import { Building2, UserPlus, Shield, Plus, Trash2, AlertCircle, CheckCircle2, Key, Users, Edit2, X, Save } from 'lucide-react';
import { HealthUnit, User } from '../types/census';
import { cn } from '../utils/cn';

interface AdminPanelProps {
  token: string;
}

type Tab = 'units' | 'users';

export default function AdminPanel({ token }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('units');
  const [units, setUnits] = useState<HealthUnit[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Editing states
  const [editingUnit, setEditingUnit] = useState<HealthUnit | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form states
  const [newUnit, setNewUnit] = useState({ nombre: '', clues: '' });
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'UNIT_USER', health_unit_id: '' });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchUnits(), fetchUsers()]);
    setLoading(false);
  };

  const fetchUnits = async () => {
    try {
      const response = await fetch('/api/admin/units', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUnits(data);
      }
    } catch (err) {
      setError('Error al cargar unidades');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (err) {
      setError('Error al cargar usuarios');
    }
  };

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/admin/units', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newUnit)
      });
      if (response.ok) {
        setSuccess('Unidad creada exitosamente');
        setNewUnit({ nombre: '', clues: '' });
        fetchUnits();
      } else {
        const data = await response.json();
        setError(data.error || 'Error al crear unidad');
      }
    } catch (err) {
      setError('Error de conexión');
    }
  };

  const handleUpdateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUnit) return;
    try {
      const response = await fetch(`/api/admin/units/${editingUnit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editingUnit)
      });
      if (response.ok) {
        setSuccess('Unidad actualizada');
        setEditingUnit(null);
        fetchUnits();
      }
    } catch (err) {
      setError('Error al actualizar');
    }
  };

  const handleDeleteUnit = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar esta unidad? No se puede eliminar si tiene registros asociados.')) return;
    try {
      const response = await fetch(`/api/admin/units/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setSuccess('Unidad eliminada');
        fetchUnits();
      } else {
        const data = await response.json();
        setError(data.error || 'No se pudo eliminar');
      }
    } catch (err) {
      setError('Error de conexión');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newUser,
          health_unit_id: newUser.role === 'ADMIN' ? null : parseInt(newUser.health_unit_id)
        })
      });
      if (response.ok) {
        setSuccess('Usuario creado exitosamente');
        setNewUser({ username: '', password: '', role: 'UNIT_USER', health_unit_id: '' });
        fetchUsers();
      } else {
        const data = await response.json();
        setError(data.error || 'Error al crear usuario');
      }
    } catch (err) {
      setError('Error de conexión');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editingUser)
      });
      if (response.ok) {
        setSuccess('Usuario actualizado');
        setEditingUser(null);
        fetchUsers();
      }
    } catch (err) {
      setError('Error al actualizar');
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este usuario?')) return;
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setSuccess('Usuario eliminado');
        fetchUsers();
      } else {
        const data = await response.json();
        setError(data.error || 'No se pudo eliminar');
      }
    } catch (err) {
      setError('Error de conexión');
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-[#141414]/5 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('units')}
          className={cn(
            "px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
            activeTab === 'units' ? "bg-[#141414] text-[#E4E3E0] shadow-lg" : "text-[#141414]/40 hover:text-[#141414]"
          )}
        >
          <Building2 className="w-4 h-4" />
          UNIDADES DE SALUD
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={cn(
            "px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
            activeTab === 'users' ? "bg-[#141414] text-[#E4E3E0] shadow-lg" : "text-[#141414]/40 hover:text-[#141414]"
          )}
        >
          <Users className="w-4 h-4" />
          USUARIOS Y ACCESOS
        </button>
      </div>

      {/* Notifications */}
      {(error || success) && (
        <div className={cn(
          "p-4 rounded-xl flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-4",
          error ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
        )}>
          {error ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          <p className="font-bold">{error || success}</p>
          <button onClick={() => { setError(''); setSuccess(''); }} className="ml-auto opacity-40 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-1 space-y-6">
          {activeTab === 'units' ? (
            <section className="bg-white border border-[#141414]/10 rounded-2xl p-6 shadow-sm sticky top-8">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5" />
                {editingUnit ? 'Editar Unidad' : 'Nueva Unidad'}
              </h3>
              <form onSubmit={editingUnit ? handleUpdateUnit : handleCreateUnit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold opacity-40">Nombre de la Unidad</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-[#E4E3E0]/30 border border-[#141414]/10 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#141414]/5 transition-all text-sm font-bold"
                    value={editingUnit ? editingUnit.nombre : newUnit.nombre}
                    onChange={(e) => editingUnit ? setEditingUnit({ ...editingUnit, nombre: e.target.value }) : setNewUnit({ ...newUnit, nombre: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold opacity-40">CLUES</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-[#E4E3E0]/30 border border-[#141414]/10 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#141414]/5 transition-all text-sm font-mono font-bold"
                    value={editingUnit ? editingUnit.clues : newUnit.clues}
                    onChange={(e) => editingUnit ? setEditingUnit({ ...editingUnit, clues: e.target.value }) : setNewUnit({ ...newUnit, clues: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 bg-[#141414] text-[#E4E3E0] py-3 rounded-xl font-bold text-xs tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2">
                    {editingUnit ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {editingUnit ? 'ACTUALIZAR' : 'REGISTRAR'}
                  </button>
                  {editingUnit && (
                    <button type="button" onClick={() => setEditingUnit(null)} className="p-3 border border-[#141414]/10 rounded-xl hover:bg-gray-100 transition-all text-[#141414]/60">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </form>
            </section>
          ) : (
            <section className="bg-white border border-[#141414]/10 rounded-2xl p-6 shadow-sm sticky top-8">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h3>
              <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold opacity-40">Username</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-[#E4E3E0]/30 border border-[#141414]/10 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#141414]/5 transition-all text-sm font-bold"
                    value={editingUser ? editingUser.username : newUser.username}
                    onChange={(e) => editingUser ? setEditingUser({ ...editingUser, username: e.target.value }) : setNewUser({ ...newUser, username: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold opacity-40">
                    {editingUser ? 'Nueva Contraseña (Opcional)' : 'Contraseña'}
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    className="w-full bg-[#E4E3E0]/30 border border-[#141414]/10 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#141414]/5 transition-all text-sm font-bold"
                    value={editingUser ? editingUser.password || '' : newUser.password}
                    onChange={(e) => editingUser ? setEditingUser({ ...editingUser, password: e.target.value }) : setNewUser({ ...newUser, password: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest font-bold opacity-40">Rol</label>
                    <select
                      className="w-full bg-[#E4E3E0]/30 border border-[#141414]/10 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#141414]/5 transition-all text-xs font-bold"
                      value={editingUser ? editingUser.role : newUser.role}
                      onChange={(e) => editingUser ? setEditingUser({ ...editingUser, role: e.target.value as any }) : setNewUser({ ...newUser, role: e.target.value as any })}
                    >
                      <option value="UNIT_USER">UNIT_USER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest font-bold opacity-40">Unidad</label>
                    <select
                      disabled={(editingUser ? editingUser.role : newUser.role) === 'ADMIN'}
                      className="w-full bg-[#E4E3E0]/30 border border-[#141414]/10 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#141414]/5 transition-all text-xs font-bold disabled:opacity-20"
                      value={editingUser ? (editingUser.health_unit_id || '') : newUser.health_unit_id}
                      onChange={(e) => editingUser ? setEditingUser({ ...editingUser, health_unit_id: e.target.value ? parseInt(e.target.value) : null }) : setNewUser({ ...newUser, health_unit_id: e.target.value })}
                    >
                      <option value="">Ninguna...</option>
                      {units.map(u => (
                        <option key={u.id} value={u.id}>{u.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 bg-[#141414] text-[#E4E3E0] py-3 rounded-xl font-bold text-xs tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2">
                    {editingUser ? <Save className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                    {editingUser ? 'ACTUALIZAR' : 'CREAR ACCESO'}
                  </button>
                  {editingUser && (
                    <button type="button" onClick={() => setEditingUser(null)} className="p-3 border border-[#141414]/10 rounded-xl hover:bg-gray-100 transition-all text-[#141414]/60">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </form>
            </section>
          )}
        </div>

        {/* List Column */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-[#141414]/10 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-[#141414]/5 bg-gray-50/50">
              <h3 className="font-serif italic text-xl">
                {activeTab === 'units' ? 'Inventario de Unidades' : 'Lista de Usuarios'}
              </h3>
            </div>

            <div className="divide-y divide-[#141414]/5">
              {activeTab === 'units' ? (
                units.length === 0 ? (
                  <div className="p-12 text-center opacity-30 italic">No hay unidades registradas</div>
                ) : (
                  units.map(unit => (
                    <div key={unit.id} className="p-5 flex items-center justify-between hover:bg-[#141414]/[0.02] transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center font-serif font-bold italic">
                          {unit.id}
                        </div>
                        <div>
                          <p className="font-bold text-sm tracking-tight">{unit.nombre}</p>
                          <p className="text-[10px] font-mono opacity-50 uppercase tracking-widest font-bold">{unit.clues}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => setEditingUnit(unit)} className="p-2.5 bg-white border border-[#141414]/10 rounded-lg hover:bg-[#141414] hover:text-white transition-all shadow-sm">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteUnit(unit.id)} className="p-2.5 bg-white border border-red-100 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )
              ) : (
                users.length === 0 ? (
                  <div className="p-12 text-center opacity-30 italic">No hay usuarios registrados</div>
                ) : (
                  users.map(u => (
                    <div key={u.id} className="p-5 flex items-center justify-between hover:bg-[#141414]/[0.02] transition-all group">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center text-xs font-black",
                          u.role === 'ADMIN' ? "bg-[#141414] text-[#E4E3E0]" : "bg-emerald-500 text-white"
                        )}>
                          {u.username.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-sm flex items-center gap-2">
                            {u.username}
                            {u.role === 'ADMIN' && <Shield className="w-3 h-3 text-amber-500" />}
                          </p>
                          <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest truncate max-w-[200px]">
                            {u.health_unit_name || 'Sin Unidad Asignada'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => setEditingUser(u)} className="p-2.5 bg-white border border-[#141414]/10 rounded-lg hover:bg-[#141414] hover:text-white transition-all shadow-sm">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteUser(u.id)} className="p-2.5 bg-white border border-red-100 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
