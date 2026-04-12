import React, { useState, useEffect } from 'react';
import { Building2, UserPlus, Shield, Plus, Trash2, AlertCircle, CheckCircle2, Key, Users, Edit2, X, Save } from 'lucide-react';
import { HealthUnit, User, Estado, Region, Zona } from '../types/census';
import { cn } from '../utils/cn';

interface AdminPanelProps {
  token: string;
}

type Tab = 'units' | 'users' | 'estados' | 'regiones' | 'zonas';

export default function AdminPanel({ token }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('units');
  const [units, setUnits] = useState<HealthUnit[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [estados, setEstados] = useState<Estado[]>([]);
  const [regiones, setRegiones] = useState<Region[]>([]);
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Editing states
  const [editingUnit, setEditingUnit] = useState<HealthUnit | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form states
  const [newUnit, setNewUnit] = useState({ nombre: '', clues: '', zona_id: '' });
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    role: 'UNIT_USER',
    health_unit_id: '',
    estado_id: '',
    region_id: '',
    zona_id: ''
  });
  const [newEstado, setNewEstado] = useState({ nombre: '' });
  const [newRegion, setNewRegion] = useState({ nombre: '', estado_id: '' });
  const [newZona, setNewZona] = useState({ nombre: '', region_id: '' });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchUnits(),
      fetchUsers(),
      fetchEstados(),
      fetchRegiones(),
      fetchZonas()
    ]);
    setLoading(false);
  };

  const fetchEstados = async () => {
    try {
      const response = await fetch('/api/admin/estados', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) setEstados(await response.json());
    } catch (err) { setError('Error al cargar estados'); }
  };

  const fetchRegiones = async () => {
    try {
      const response = await fetch('/api/admin/regiones', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) setRegiones(await response.json());
    } catch (err) { setError('Error al cargar regiones'); }
  };

  const fetchZonas = async () => {
    try {
      const response = await fetch('/api/admin/zonas', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) setZonas(await response.json());
    } catch (err) { setError('Error al cargar zonas'); }
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
    } catch (err) { setError('Error al cargar unidades'); }
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
    } catch (err) { setError('Error al cargar usuarios'); }
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
        body: JSON.stringify({
          ...newUnit,
          zona_id: newUnit.zona_id ? parseInt(newUnit.zona_id) : null
        })
      });
      if (response.ok) {
        setSuccess('Unidad creada exitosamente');
        setNewUnit({ nombre: '', clues: '', zona_id: '' });
        fetchUnits();
      } else {
        const data = await response.json();
        setError(data.error || 'Error al crear unidad');
      }
    } catch (err) { setError('Error de conexión'); }
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
    } catch (err) { setError('Error al actualizar'); }
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
    } catch (err) { setError('Error de conexión'); }
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
          health_unit_id: newUser.role === 'UNIT_USER' ? parseInt(newUser.health_unit_id) : null,
          estado_id: ['ESTATAL', 'REGIONAL', 'ZONAL', 'UNIT_USER'].includes(newUser.role) ? parseInt(newUser.estado_id) : null,
          region_id: ['REGIONAL', 'ZONAL', 'UNIT_USER'].includes(newUser.role) ? parseInt(newUser.region_id) : null,
          zona_id: ['ZONAL', 'UNIT_USER'].includes(newUser.role) ? parseInt(newUser.zona_id) : null
        })
      });
      if (response.ok) {
        setSuccess('Usuario creado exitosamente');
        setNewUser({ username: '', password: '', role: 'UNIT_USER', health_unit_id: '', estado_id: '', region_id: '', zona_id: '' });
        fetchUsers();
      } else {
        const data = await response.json();
        setError(data.error || 'Error al crear usuario');
      }
    } catch (err) { setError('Error de conexión'); }
  };

  const handleCreateEstado = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/estados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newEstado)
      });
      if (response.ok) {
        setSuccess('Estado creado');
        setNewEstado({ nombre: '' });
        fetchEstados();
      }
    } catch (err) { setError('Error al crear estado'); }
  };

  const handleCreateRegion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/regiones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...newRegion, estado_id: parseInt(newRegion.estado_id) })
      });
      if (response.ok) {
        setSuccess('Región creada');
        setNewRegion({ nombre: '', estado_id: '' });
        fetchRegiones();
      }
    } catch (err) { setError('Error al crear región'); }
  };

  const handleCreateZona = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/zonas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...newZona, region_id: parseInt(newZona.region_id) })
      });
      if (response.ok) {
        setSuccess('Zona creada');
        setNewZona({ nombre: '', region_id: '' });
        fetchZonas();
      }
    } catch (err) { setError('Error al crear zona'); }
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
        body: JSON.stringify({
          ...editingUser,
          health_unit_id: editingUser.role === 'UNIT_USER' ? editingUser.health_unit_id : null,
          estado_id: ['ESTATAL', 'REGIONAL', 'ZONAL', 'UNIT_USER'].includes(editingUser.role) ? editingUser.estado_id : null,
          region_id: ['REGIONAL', 'ZONAL', 'UNIT_USER'].includes(editingUser.role) ? editingUser.region_id : null,
          zona_id: ['ZONAL', 'UNIT_USER'].includes(editingUser.role) ? editingUser.zona_id : null
        })
      });
      if (response.ok) {
        setSuccess('Usuario actualizado');
        setEditingUser(null);
        fetchUsers();
      }
    } catch (err) { setError('Error al actualizar'); }
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
    } catch (err) { setError('Error de conexión'); }
  };

  if (loading) {
    return <div className="p-12 text-center font-bold animate-pulse">Cargando panel de control...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1 bg-[#141414]/5 rounded-xl w-fit">
        <button onClick={() => setActiveTab('units')} className={cn("px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2", activeTab === 'units' ? "bg-[#141414] text-[#E4E3E0] shadow-lg" : "text-[#141414]/40 hover:text-[#141414]")}>
          <Building2 className="w-4 h-4" /> UNIDADES
        </button>
        <button onClick={() => setActiveTab('users')} className={cn("px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2", activeTab === 'users' ? "bg-[#141414] text-[#E4E3E0] shadow-lg" : "text-[#141414]/40 hover:text-[#141414]")}>
          <Users className="w-4 h-4" /> USUARIOS
        </button>
        <button onClick={() => setActiveTab('estados')} className={cn("px-4 py-2 rounded-lg text-[10px] font-bold transition-all", activeTab === 'estados' ? "bg-[#141414] text-[#E4E3E0]" : "text-[#141414]/40")}>
          ESTADOS
        </button>
        <button onClick={() => setActiveTab('regiones')} className={cn("px-4 py-2 rounded-lg text-[10px] font-bold transition-all", activeTab === 'regiones' ? "bg-[#141414] text-[#E4E3E0]" : "text-[#141414]/40")}>
          REGIONES
        </button>
        <button onClick={() => setActiveTab('zonas')} className={cn("px-4 py-2 rounded-lg text-[10px] font-bold transition-all", activeTab === 'zonas' ? "bg-[#141414] text-[#E4E3E0]" : "text-[#141414]/40")}>
          ZONAS
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
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold opacity-40">Zona (Jerarquía)</label>
                  <select
                    required
                    className="w-full bg-[#E4E3E0]/30 border border-[#141414]/10 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#141414]/5 transition-all text-xs font-bold"
                    value={editingUnit ? (editingUnit.zona_id || '') : newUnit.zona_id}
                    onChange={(e) => editingUnit ? setEditingUnit({ ...editingUnit, zona_id: parseInt(e.target.value) }) : setNewUnit({ ...newUnit, zona_id: e.target.value })}
                  >
                    <option value="">Seleccionar Zona...</option>
                    {zonas.map(z => (
                      <option key={z.id} value={z.id}>{z.nombre} ({z.region_nombre})</option>
                    ))}
                  </select>
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
          ) : activeTab === 'users' ? (
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
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest font-bold opacity-40">Rol / Nivel de Acceso</label>
                    <select
                      className="w-full bg-[#E4E3E0]/30 border border-[#141414]/10 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#141414]/5 transition-all text-xs font-bold"
                      value={editingUser ? editingUser.role : newUser.role}
                      onChange={(e) => editingUser ? setEditingUser({ ...editingUser, role: e.target.value as any }) : setNewUser({ ...newUser, role: e.target.value as any })}
                    >
                      <option value="UNIT_USER">LOCAL (Unidad Específica)</option>
                      <option value="ZONAL">ZONAL (Varias Unidades)</option>
                      <option value="REGIONAL">REGIONAL</option>
                      <option value="ESTATAL">ESTATAL</option>
                      <option value="ADMIN">NACIONAL (Administrador)</option>
                    </select>
                  </div>

                  {['ESTATAL', 'REGIONAL', 'ZONAL', 'UNIT_USER'].includes(editingUser?.role || newUser.role) && (
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest font-bold opacity-40">Estado</label>
                      <select
                        required
                        className="w-full bg-[#E4E3E0]/30 border border-[#141414]/10 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#141414]/5 transition-all text-xs font-bold"
                        value={editingUser ? (editingUser.estado_id || '') : newUser.estado_id}
                        onChange={(e) => editingUser ? setEditingUser({ ...editingUser, estado_id: parseInt(e.target.value) }) : setNewUser({ ...newUser, estado_id: e.target.value })}
                      >
                        <option value="">Seleccionar Estado...</option>
                        {estados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                      </select>
                    </div>
                  )}

                  {['REGIONAL', 'ZONAL', 'UNIT_USER'].includes(editingUser?.role || newUser.role) && (
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest font-bold opacity-40">Región</label>
                      <select
                        required
                        className="w-full bg-[#E4E3E0]/30 border border-[#141414]/10 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#141414]/5 transition-all text-xs font-bold"
                        value={editingUser ? (editingUser.region_id || '') : newUser.region_id}
                        onChange={(e) => editingUser ? setEditingUser({ ...editingUser, region_id: parseInt(e.target.value) }) : setNewUser({ ...newUser, region_id: e.target.value })}
                      >
                        <option value="">Seleccionar Región...</option>
                        {regiones.filter(r => r.estado_id === parseInt((editingUser?.estado_id || newUser.estado_id) as any)).map(r => (
                          <option key={r.id} value={r.id}>{r.nombre}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {['ZONAL', 'UNIT_USER'].includes(editingUser?.role || newUser.role) && (
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest font-bold opacity-40">Zona</label>
                      <select
                        required
                        className="w-full bg-[#E4E3E0]/33 border border-[#141414]/10 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#141414]/5 transition-all text-xs font-bold"
                        value={editingUser ? (editingUser.zona_id || '') : newUser.zona_id}
                        onChange={(e) => editingUser ? setEditingUser({ ...editingUser, zona_id: parseInt(e.target.value) }) : setNewUser({ ...newUser, zona_id: e.target.value })}
                      >
                        <option value="">Seleccionar Zona...</option>
                        {zonas.filter(z => z.region_id === parseInt((editingUser?.region_id || newUser.region_id) as any)).map(z => (
                          <option key={z.id} value={z.id}>{z.nombre}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {['UNIT_USER'].includes(editingUser?.role || newUser.role) && (
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest font-bold opacity-40">Unidad de Salud</label>
                      <select
                        required
                        className="w-full bg-[#E4E3E0]/30 border border-[#141414]/10 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#141414]/5 transition-all text-xs font-bold"
                        value={editingUser ? (editingUser.health_unit_id || '') : newUser.health_unit_id}
                        onChange={(e) => editingUser ? setEditingUser({ ...editingUser, health_unit_id: parseInt(e.target.value) }) : setNewUser({ ...newUser, health_unit_id: e.target.value })}
                      >
                        <option value="">Seleccionar Unidad...</option>
                        {units.filter(u => u.zona_id === parseInt((editingUser?.zona_id || newUser.zona_id) as any)).map(u => (
                          <option key={u.id} value={u.id}>{u.nombre}</option>
                        ))}
                      </select>
                    </div>
                  )}
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
          ) : activeTab === 'estados' ? (
            <section className="bg-white border border-[#141414]/10 rounded-2xl p-6 shadow-sm sticky top-8">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5" /> Nuevo Estado
              </h3>
              <form onSubmit={handleCreateEstado} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold opacity-40">Nombre</label>
                  <input type="text" required className="w-full bg-[#E4E3E0]/30 border border-[#141414]/10 rounded-xl py-2.5 px-4 text-sm font-bold" value={newEstado.nombre} onChange={e => setNewEstado({ ...newEstado, nombre: e.target.value })} />
                </div>
                <button type="submit" className="w-full bg-[#141414] text-[#E4E3E0] py-3 rounded-xl font-bold text-xs tracking-widest hover:opacity-90">REGISTRAR ESTADO</button>
              </form>
            </section>
          ) : activeTab === 'regiones' ? (
            <section className="bg-white border border-[#141414]/10 rounded-2xl p-6 shadow-sm sticky top-8">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5" /> Nueva Región
              </h3>
              <form onSubmit={handleCreateRegion} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold opacity-40">Estado</label>
                  <select required className="w-full bg-[#E4E3E0]/30 border border-[#141414]/10 rounded-xl py-2.5 px-4 text-xs font-bold" value={newRegion.estado_id} onChange={e => setNewRegion({ ...newRegion, estado_id: e.target.value })}>
                    <option value="">Seleccionar Estado...</option>
                    {estados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold opacity-40">Nombre de Región</label>
                  <input type="text" required className="w-full bg-[#E4E3E0]/30 border border-[#141414]/10 rounded-xl py-2.5 px-4 text-sm font-bold" value={newRegion.nombre} onChange={e => setNewRegion({ ...newRegion, nombre: e.target.value })} />
                </div>
                <button type="submit" className="w-full bg-[#141414] text-[#E4E3E0] py-3 rounded-xl font-bold text-xs tracking-widest hover:opacity-90">REGISTRAR REGIÓN</button>
              </form>
            </section>
          ) : (
            <section className="bg-white border border-[#141414]/10 rounded-2xl p-6 shadow-sm sticky top-8">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5" /> Nueva Zona
              </h3>
              <form onSubmit={handleCreateZona} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold opacity-40">Región</label>
                  <select required className="w-full bg-[#E4E3E0]/30 border border-[#141414]/10 rounded-xl py-2.5 px-4 text-xs font-bold" value={newZona.region_id} onChange={e => setNewZona({ ...newZona, region_id: e.target.value })}>
                    <option value="">Seleccionar Región...</option>
                    {regiones.map(r => <option key={r.id} value={r.id}>{r.nombre} ({r.estado_nombre})</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold opacity-40">Nombre de Zona</label>
                  <input type="text" required className="w-full bg-[#E4E3E0]/30 border border-[#141414]/10 rounded-xl py-2.5 px-4 text-sm font-bold" value={newZona.nombre} onChange={e => setNewZona({ ...newZona, nombre: e.target.value })} />
                </div>
                <button type="submit" className="w-full bg-[#141414] text-[#E4E3E0] py-3 rounded-xl font-bold text-xs tracking-widest hover:opacity-90">REGISTRAR ZONA</button>
              </form>
            </section>
          )}
        </div>

        {/* List Column */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-[#141414]/10 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-[#141414]/5 bg-gray-50/50">
              <h3 className="font-serif italic text-xl">
                {activeTab === 'units' ? 'Inventario de Unidades' :
                  activeTab === 'users' ? 'Lista de Usuarios' :
                    activeTab === 'estados' ? 'Estados de Salud Nacional' :
                      activeTab === 'regiones' ? 'Regiones Sanitarias' : 'Zonas y Jurisdicciones'}
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
              ) : activeTab === 'users' ? (
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
                            <span className="text-[8px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{u.role}</span>
                          </p>
                          <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest truncate max-w-[200px]">
                            {u.health_unit_name || 'Gestión Administrativa'}
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
              ) : activeTab === 'estados' ? (
                estados.map(e => (
                  <div key={e.id} className="p-4 flex justify-between items-center hover:bg-[#141414]/[0.02]">
                    <span className="font-bold text-sm tracking-tight">{e.nombre}</span>
                    <span className="text-[10px] opacity-40 font-bold">ID: {e.id}</span>
                  </div>
                ))
              ) : activeTab === 'regiones' ? (
                regiones.map(r => (
                  <div key={r.id} className="p-4 flex justify-between items-center hover:bg-[#141414]/[0.02]">
                    <div>
                      <p className="font-bold text-sm tracking-tight">{r.nombre}</p>
                      <p className="text-[10px] opacity-40 font-bold uppercase">{r.estado_nombre}</p>
                    </div>
                  </div>
                ))
              ) : (
                zonas.map(z => (
                  <div key={z.id} className="p-4 flex justify-between items-center hover:bg-[#141414]/[0.02]">
                    <div>
                      <p className="font-bold text-sm tracking-tight">{z.nombre}</p>
                      <p className="text-[10px] opacity-40 font-bold uppercase">{z.region_nombre}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
