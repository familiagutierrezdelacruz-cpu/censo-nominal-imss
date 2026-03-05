import React, { useState, useEffect, Component } from 'react';
import {
  ClipboardList,
  Plus,
  Search,
  User as UserIcon,
  Calendar,
  Activity,
  MapPin,
  FileText,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  Table as TableIcon,
  Archive,
  RefreshCw,
  LogOut,
  ShieldCheck,
  Stethoscope,
  PlusCircle,
  List as ListIcon,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CensusRecord } from './types/census';
import {
  calculateAge,
  calculateSDG,
  calculateFPP,
  calculateTAM,
  calculatePuerperioDays,
  calculateDaysSinceUpdate
} from './utils/calculations';
import { cn } from './utils/cn';

// Components
import CensusForm from './components/CensusForm';
import CensusList from './components/CensusList';
import CensusDetail from './components/CensusDetail';
import NucleoManager from './components/NucleoManager';
import CensusReport from './components/CensusReport';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import ExcelImport from './components/ExcelImport';
import { LayoutDashboard, Wifi, WifiOff, Cloud, RefreshCw as SyncIcon } from 'lucide-react';
import { AuthResponse, User as UserType } from './types/census';
import { savePendingAction, getPendingRecords, clearPendingRecord, cacheRecords, getCachedRecords } from './utils/db';

// Error Boundary Component
class ErrorBoundary extends Component<any, any> {
  public state: any;
  public props: any;

  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
    this.props = props;
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('React Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#E4E3E0] flex items-center justify-center p-6">
          <div className="bg-white p-10 rounded-3xl border border-[#141414]/10 shadow-2xl max-w-md text-center space-y-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-serif italic">Algo salió mal</h1>
            <p className="text-sm opacity-60">
              Hubo un error al cargar esta sección. Por favor, intenta recargar la página.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-[#141414] text-[#E4E3E0] py-3 rounded-xl font-bold hover:opacity-90 transition-all"
            >
              RECARGAR PÁGINA
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const [view, setView] = useState<'dashboard' | 'records' | 'historical' | 'form' | 'detail' | 'nucleos' | 'report' | 'admin'>('dashboard');
  const [records, setRecords] = useState<CensusRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<CensusRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ show: false, title: '', message: '', onConfirm: () => { } });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);

  // Auth state
  const [token, setToken] = useState<string | null>(localStorage.getItem('census_token'));
  const [user, setUser] = useState<UserType | null>(() => {
    try {
      return JSON.parse(localStorage.getItem('census_user') || 'null');
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (token) {
      fetchRecords();
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [token]);

  useEffect(() => {
    if (isOnline && token) {
      syncPendingRecords();
    }
  }, [isOnline, token]);

  useEffect(() => {
    if (records.length > 0) {
      console.log('Total records:', records.length);
      console.log('Active records:', records.filter(r => Number(r.is_historical) !== 1).length);
      console.log('Historical records:', records.filter(r => Number(r.is_historical) === 1).length);
    }
  }, [records]);

  const handleLogin = (auth: AuthResponse) => {
    setToken(auth.token);
    setUser(auth.user);
    localStorage.setItem('census_token', auth.token);
    localStorage.setItem('census_user', JSON.stringify(auth.user));
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('census_token');
    localStorage.removeItem('census_user');
    setView('dashboard');
  };

  const fetchRecords = async () => {
    if (!token) return;
    setLoading(true);
    try {
      if (!isOnline) {
        const cached = await getCachedRecords();
        setRecords(cached);
        return;
      }

      const response = await fetch('/api/census?historical=true', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401 || response.status === 403) {
        handleLogout();
        return;
      }

      const data: CensusRecord[] = await response.json();
      await cacheRecords(data);

      // Sort records: 1. Unit (if admin), 2. Nucleo, 3. Name, 4. Risk
      const sortedData = [...data].sort((a, b) => {
        // 0. Unit (only if admin)
        if (user?.role === 'ADMIN') {
          const unitA = a.health_unit_id || 0;
          const unitB = b.health_unit_id || 0;
          if (unitA !== unitB) return unitA - unitB;
        }

        // 1. Nucleo
        const nucleoA = a.nucleo_nombre || '';
        const nucleoB = b.nucleo_nombre || '';
        if (nucleoA !== nucleoB) return nucleoA.localeCompare(nucleoB);

        // 2. Nombre
        const nombreA = a.nombre || '';
        const nombreB = b.nombre || '';
        if (nombreA !== nombreB) return nombreA.localeCompare(nombreB);

        // 3. Riesgo (Higher risk first)
        return (b.riesgo_obstetrico || 0) - (a.riesgo_obstetrico || 0);
      });

      setRecords(sortedData);
    } catch (error) {
      console.error('Error fetching records:', error);
      const cached = await getCachedRecords();
      if (cached.length > 0) setRecords(cached);
    } finally {
      setLoading(false);
    }
  };

  const syncPendingRecords = async () => {
    const pending = await getPendingRecords();
    if (pending.length === 0) return;

    setSyncing(true);
    let successCount = 0;

    for (const item of pending) {
      try {
        const response = await fetch(item.url, {
          method: item.method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: item.method !== 'GET' ? JSON.stringify(item.data) : undefined,
        });

        if (response.ok) {
          await clearPendingRecord(item.id);
          successCount++;
        }
      } catch (error) {
        console.error('Failed to sync item:', item, error);
      }
    }

    if (successCount > 0) {
      fetchRecords();
    }
    setSyncing(false);
  };

  const handleSave = async (data: CensusRecord) => {
    if (!token) return;
    const isEditing = !!data.id;
    const url = isEditing ? `/api/census/${data.id}` : '/api/census';
    const method = isEditing ? 'PUT' : 'POST';

    if (!isOnline) {
      await savePendingAction({
        data,
        type: isEditing ? 'UPDATE' : 'CREATE',
        url,
        method
      });
      setView(data.is_historical ? 'historical' : 'records');
      setSelectedRecord(null);
      setErrorMsg('Guardado localmente. Se sincronizará al recuperar internet.');
      // Update local state for immediate feedback
      if (isEditing) {
        setRecords(prev => prev.map(r => r.id === data.id ? data : r));
      } else {
        setRecords(prev => [{ ...data, id: Date.now() }, ...prev]);
      }
      return;
    }

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await fetchRecords();
        setView(data.is_historical ? 'historical' : 'records');
        setSelectedRecord(null);
        setSearchTerm('');
      } else {
        const errorData = await response.json();
        setErrorMsg(`Error al guardar: ${errorData.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error saving record:', error);
      await savePendingAction({
        data,
        type: isEditing ? 'UPDATE' : 'CREATE',
        url,
        method
      });
      setErrorMsg('Error de conexión. Guardado localmente.');
      setView(data.is_historical ? 'historical' : 'records');
      setSelectedRecord(null);
    }
  };

  const handleArchive = async (id: number) => {
    setConfirmModal({
      show: true,
      title: 'Archivar Registro',
      message: '¿Desea mover este registro al histórico?',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, show: false }));
        const url = `/api/census/${id}/archive`;
        const method = 'POST';

        if (!isOnline) {
          await savePendingAction({ data: { id }, type: 'ARCHIVE', url, method });
          setErrorMsg('Acción guardada localmente.');
          setRecords(prev => prev.map(r => r.id === id ? { ...r, is_historical: 1 } : r));
          return;
        }

        try {
          const response = await fetch(url, {
            method,
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al archivar');
          }
          await fetchRecords();
        } catch (error: any) {
          console.error('Archive error:', error);
          await savePendingAction({ data: { id }, type: 'ARCHIVE', url, method });
          setErrorMsg('Error de conexión. Acción guardada localmente.');
        }
      }
    });
  };

  const handleRestore = async (id: number) => {
    setConfirmModal({
      show: true,
      title: 'Restaurar Registro',
      message: '¿Desea restaurar este registro del histórico?',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, show: false }));
        const url = `/api/census/${id}/restore`;
        const method = 'POST';

        if (!isOnline) {
          await savePendingAction({ data: { id }, type: 'RESTORE', url, method });
          setErrorMsg('Acción guardada localmente.');
          setRecords(prev => prev.map(r => r.id === id ? { ...r, is_historical: 0 } : r));
          return;
        }

        try {
          const response = await fetch(url, {
            method,
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al restaurar');
          }
          await fetchRecords();
        } catch (error: any) {
          console.error('Restore error:', error);
          await savePendingAction({ data: { id }, type: 'RESTORE', url, method });
          setErrorMsg('Error de conexión. Acción guardada localmente.');
        }
      }
    });
  };

  const handleDelete = async (id: number) => {
    setConfirmModal({
      show: true,
      title: 'Eliminar Registro',
      message: '¿Está seguro de que desea eliminar este registro permanentemente? Esta acción no se puede deshacer.',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, show: false }));
        const url = `/api/census/${id}`;
        const method = 'DELETE';

        if (!isOnline) {
          await savePendingAction({ data: { id }, type: 'DELETE', url, method });
          setErrorMsg('Eliminado localmente.');
          setRecords(prev => prev.filter(r => r.id !== id));
          return;
        }

        try {
          const response = await fetch(url, {
            method,
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!response.ok) {
            throw new Error('Error al eliminar');
          }
          await fetchRecords();
        } catch (error: any) {
          console.error('Delete error:', error);
          await savePendingAction({ data: { id }, type: 'DELETE', url, method });
          setErrorMsg('Error de conexión. Eliminado localmente.');
          setRecords(prev => prev.filter(r => r.id !== id));
        }
      }
    });
  };

  const filteredRecords = records.filter(r => {
    const search = searchTerm.toLowerCase();
    return (
      (r.nombre?.toLowerCase() || '').includes(search) ||
      (r.folio?.toLowerCase() || '').includes(search) ||
      (r.curp?.toLowerCase() || '').includes(search)
    );
  });

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
        {/* Sidebar / Navigation */}
        <nav className="fixed top-0 left-0 h-full w-16 md:w-64 bg-[#141414] text-[#E4E3E0] z-50 flex flex-col border-r border-[#141414]">
          <div className="p-4 md:p-6 mb-8">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-xl flex items-center justify-center p-2 shadow-sm overflow-hidden border border-white/10 group-hover:scale-105 transition-transform">
                <img
                  src="/logo.png"
                  alt="IMSS Bienestar"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = '<div class="text-[#005944] font-bold text-xl">IMSS</div>';
                  }}
                />
              </div>
              <div className="hidden md:block text-center border-t border-white/10 pt-4 w-full">
                <h1 className="font-serif italic text-lg tracking-tight leading-tight">Censo Materno</h1>
                <p className="text-[8px] uppercase tracking-[0.2em] opacity-50 font-bold mt-1 text-[#B38E5D]">Servicios Públicos de Salud</p>
              </div>
            </div>
          </div>

          <div className="flex-1 px-2 md:px-4 space-y-2">
            <button
              onClick={() => {
                setView('dashboard');
                setSelectedRecord(null);
              }}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded transition-all",
                view === 'dashboard' ? "bg-[#E4E3E0] text-[#141414]" : "hover:bg-white/10"
              )}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="hidden md:block font-medium">Dashboard</span>
            </button>
            <button
              onClick={() => {
                setView('records');
                setSelectedRecord(null);
              }}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded transition-all",
                view === 'records' ? "bg-[#E4E3E0] text-[#141414]" : "hover:bg-white/10"
              )}
            >
              <ListIcon className="w-5 h-5" />
              <span className="hidden md:block font-medium">Censo Nominal</span>
            </button>
            <button
              onClick={() => {
                setView('historical');
                setSelectedRecord(null);
              }}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded transition-all",
                view === 'historical' ? "bg-[#E4E3E0] text-[#141414]" : "hover:bg-white/10"
              )}
            >
              <Clock className="w-5 h-5" />
              <span className="hidden md:block font-medium">Histórico</span>
            </button>
            <button
              onClick={() => {
                setSelectedRecord(null);
                setView('form');
              }}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded transition-all",
                view === 'form' && !selectedRecord ? "bg-[#E4E3E0] text-[#141414]" : "hover:bg-white/10"
              )}
            >
              <Plus className="w-5 h-5" />
              <span className="hidden md:block font-medium">Nuevo Registro</span>
            </button>
            <button
              onClick={() => {
                setSelectedRecord(null);
                setView('nucleos');
              }}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded transition-all",
                view === 'nucleos' ? "bg-[#E4E3E0] text-[#141414]" : "hover:bg-white/10"
              )}
            >
              <Stethoscope className="w-5 h-5" />
              <span className="hidden md:block font-medium">Gestionar Núcleos</span>
            </button>
            <button
              onClick={() => {
                setSelectedRecord(null);
                setView('report');
              }}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded transition-all",
                view === 'report' ? "bg-[#E4E3E0] text-[#141414]" : "hover:bg-white/10"
              )}
            >
              <TableIcon className="w-5 h-5" />
              <span className="hidden md:block font-medium">Reporte Sábana</span>
            </button>

            {user?.role === 'ADMIN' && (
              <button
                onClick={() => {
                  setSelectedRecord(null);
                  setView('admin');
                }}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded transition-all",
                  view === 'admin' ? "bg-[#E4E3E0] text-[#141414]" : "hover:bg-white/10"
                )}
              >
                <ShieldCheck className="w-5 h-5" />
                <span className="hidden md:block font-medium">Admin Panel</span>
              </button>
            )}
          </div>

          <div className="p-4 mt-auto border-t border-white/10">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {user?.username.substring(0, 2).toUpperCase()}
                </div>
                <div className="hidden md:block truncate">
                  <p className="text-xs font-bold truncate">{user?.username}</p>
                  <p className="text-[10px] opacity-50 uppercase tracking-widest truncate max-w-[120px]">
                    {user?.health_unit_name || (user?.role === 'ADMIN' ? 'Admin Global' : 'Unidad No Asignada')}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-white/10 rounded-lg transition-all text-red-400 hover:text-red-300"
                title="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="ml-16 md:ml-64 p-4 md:p-8 min-h-screen">
          <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="md:hidden w-12 h-12 bg-white rounded-lg p-1 shadow-sm">
                <img src="/logo.png" alt="" className="w-full h-full object-contain" />
              </div>
              <div>
                <p className="font-serif italic text-sm text-[#005944] uppercase tracking-widest mb-1">
                  {view === 'dashboard' ? 'Resumen Estadístico' : view === 'records' ? 'Gestión de Censo' : view === 'historical' ? 'Repositorio Histórico' : view === 'form' ? 'Ingreso de Datos' : view === 'nucleos' ? 'Administración' : view === 'report' ? 'Reportes' : view === 'admin' ? 'Configuración Global' : 'Detalle de Registro'}
                </p>
                <h2 className="text-4xl font-bold tracking-tighter">
                  {view === 'dashboard' ? 'Dashboard' : view === 'records' ? 'Censo Nominal' : view === 'historical' ? 'Histórico' : view === 'form' ? 'Nuevo Paciente' : view === 'nucleos' ? 'Núcleos Básicos' : view === 'report' ? 'Reporte General' : view === 'admin' ? 'Panel de Control' : selectedRecord?.nombre}
                </h2>
              </div>
            </div>

            <div className="flex gap-2 w-full md:w-auto items-center">
              {/* Online/Offline Status Indicator */}
              <div className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all",
                isOnline
                  ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                  : "bg-red-50 text-red-600 border-red-100 animate-pulse"
              )}>
                {isOnline ? (
                  <>
                    <Wifi className="w-3 h-3" />
                    <span>En Línea</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3" />
                    <span>Sin Conexión</span>
                  </>
                )}
              </div>

              {syncing && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-full text-[10px] font-bold uppercase tracking-widest">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Sincronizando...</span>
                </div>
              )}

              {(view === 'records' || view === 'historical') && (
                <button
                  onClick={fetchRecords}
                  disabled={loading}
                  className="p-2.5 bg-white border border-[#141414]/10 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 transition-all shadow-sm"
                  title="Actualizar datos"
                >
                  <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                </button>
              )}
              {view === 'records' && (
                <button
                  onClick={() => setShowImport(true)}
                  className="bg-white text-[#141414] border border-[#141414]/10 px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all flex items-center gap-2 shadow-sm"
                >
                  <Upload className="w-4 h-4" />
                  IMPORTAR EXCEL
                </button>
              )}
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                <input
                  type="text"
                  placeholder="Nombre, folio o CURP..."
                  className="w-full bg-white/50 border border-[#141414]/10 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-[#141414]/5 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button className="bg-[#141414] text-[#E4E3E0] px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-all flex items-center gap-2">
                <Search className="w-4 h-4" />
                BUSCAR
              </button>
            </div>
          </header>

          <AnimatePresence mode="wait">
            {view === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Dashboard records={records} user={user} />
              </motion.div>
            )}

            {view === 'records' && (
              <motion.div
                key="records"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <CensusList
                  records={filteredRecords.filter(r => {
                    const val = Number(r.is_historical);
                    return isNaN(val) || val !== 1;
                  })}
                  loading={loading}
                  user={user}
                  onSelect={(record) => {
                    setSelectedRecord(record);
                    setView('detail');
                  }}
                  onArchive={handleArchive}
                />
              </motion.div>
            )}

            {view === 'historical' && (
              <motion.div
                key="historical"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <CensusList
                  records={filteredRecords.filter(r => Number(r.is_historical) === 1)}
                  loading={loading}
                  user={user}
                  isHistoricalView
                  onSelect={(record) => {
                    setSelectedRecord(record);
                    setView('detail');
                  }}
                  onRestore={handleRestore}
                  onDelete={handleDelete}
                />
              </motion.div>
            )}

            {view === 'form' && (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <CensusForm
                  initialData={selectedRecord}
                  onSave={handleSave}
                  token={token!}
                  onCancel={() => {
                    setView('records');
                    setSelectedRecord(null);
                  }}
                />
              </motion.div>
            )}

            {view === 'detail' && selectedRecord && (
              <motion.div
                key="detail"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <CensusDetail
                  record={selectedRecord}
                  onBack={() => {
                    setView('records');
                    setSelectedRecord(null);
                  }}
                  onEdit={() => setView('form')}
                />
              </motion.div>
            )}

            {view === 'nucleos' && (
              <motion.div
                key="nucleos"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <NucleoManager token={token!} />
              </motion.div>
            )}

            {view === 'report' && (
              <motion.div
                key="report"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <CensusReport
                  records={records}
                  user={user}
                  onBack={() => setView('records')}
                />
              </motion.div>
            )}

            {view === 'admin' && user?.role === 'ADMIN' && (
              <motion.div
                key="admin"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <AdminPanel token={token!} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Message Overlay */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-red-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3"
              >
                <AlertCircle className="w-5 h-5" />
                <span className="font-bold">{errorMsg}</span>
                <button onClick={() => setErrorMsg(null)} className="ml-2 hover:opacity-70">
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Custom Confirmation Modal */}
          <AnimatePresence>
            {confirmModal.show && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-[#141414]/80 backdrop-blur-sm"
                  onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
                >
                  <div className="p-6">
                    <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-[#141414] mb-2">{confirmModal.title}</h3>
                    <p className="text-[#141414]/60">{confirmModal.message}</p>
                  </div>
                  <div className="p-4 bg-gray-50 flex gap-3 justify-end">
                    <button
                      onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                      className="px-4 py-2 text-sm font-bold text-[#141414]/60 hover:text-[#141414] transition-all"
                    >
                      CANCELAR
                    </button>
                    <button
                      onClick={confirmModal.onConfirm}
                      className="px-6 py-2 bg-amber-600 text-white rounded-lg text-sm font-bold hover:bg-amber-700 transition-all shadow-md"
                    >
                      CONFIRMAR
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {showImport && (
            <ExcelImport
              token={token!}
              onImportSuccess={fetchRecords}
              onClose={() => setShowImport(false)}
            />
          )}
        </main>
      </div>
    </ErrorBoundary>
  );
}
