import React from 'react';
import { differenceInDays, parseISO } from 'date-fns';
import { CensusRecord, User as UserType } from '../types/census';
import {
  calculateAge,
  calculateSDG,
  calculateDaysSinceUpdate
} from '../utils/calculations';
import {
  ChevronRight,
  AlertCircle,
  Clock,
  User,
  Calendar,
  Activity,
  Archive,
  RefreshCw,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter as FilterIcon
} from 'lucide-react';
import { cn } from '../utils/cn';

interface CensusListProps {
  records: CensusRecord[];
  loading: boolean;
  onSelect: (record: CensusRecord) => void;
  user: UserType | null;
  onArchive?: (id: number) => void;
  onRestore?: (id: number) => void;
  onDelete?: (id: number) => void;
  isHistoricalView?: boolean;
}

export default function CensusList({
  records,
  loading,
  onSelect,
  user,
  onArchive,
  onRestore,
  onDelete,
  isHistoricalView = false
}: CensusListProps) {
  const [sortConfig, setSortConfig] = React.useState<{ key: keyof CensusRecord | 'age' | 'sdg' | 'days' | 'tam'; direction: 'asc' | 'desc' } | null>(null);
  const [filterCondicion, setFilterCondicion] = React.useState<string>('');
  const [showFilterMenu, setShowFilterMenu] = React.useState(false);
  const [filterTam, setFilterTam] = React.useState<string>('');
  const [showTamFilterMenu, setShowTamFilterMenu] = React.useState(false);

  const handleSort = (key: any) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getFilteredAndSortedRecords = () => {
    let result = [...records];

    // Apply Filters
    if (filterCondicion) {
      result = result.filter(r => r.condicion === filterCondicion);
    }
    if (filterTam === 'ELEVADA') {
      result = result.filter(r => {
        if (!r.tas || !r.tad) return false;
        return ((r.tas + 2 * r.tad) / 3) > 95;
      });
    } else if (filterTam === 'NORMAL') {
      result = result.filter(r => {
        if (!r.tas || !r.tad) return false;
        return ((r.tas + 2 * r.tad) / 3) <= 95;
      });
    }

    // Apply Sorting
    if (sortConfig) {
      result.sort((a, b) => {
        let valA: any, valB: any;

        if (sortConfig.key === 'age') {
          valA = calculateAge(a.fecha_nacimiento);
          valB = calculateAge(b.fecha_nacimiento);
        } else if (sortConfig.key === 'sdg') {
          valA = a.fum ? differenceInDays(new Date(), parseISO(a.fum)) : 0;
          valB = b.fum ? differenceInDays(new Date(), parseISO(b.fum)) : 0;
        } else if (sortConfig.key === 'days') {
          valA = calculateDaysSinceUpdate(a.fecha_ultima_consulta);
          valB = calculateDaysSinceUpdate(b.fecha_ultima_consulta);
        } else if (sortConfig.key === 'tam') {
          valA = (a.tas && a.tad) ? Math.round((a.tas + 2 * a.tad) / 3) : 0;
          valB = (b.tas && b.tad) ? Math.round((b.tas + 2 * b.tad) / 3) : 0;
        } else {
          valA = a[sortConfig.key as keyof CensusRecord] || '';
          valB = b[sortConfig.key as keyof CensusRecord] || '';
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  };

  const sortedRecords = getFilteredAndSortedRecords();

  const SortIndicator = ({ column }: { column: string }) => {
    if (sortConfig?.key !== column) return <ArrowUpDown className="w-3 h-3 opacity-20" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-white" /> : <ArrowDown className="w-3 h-3 text-white" />;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 opacity-30">
        <Activity className="w-12 h-12 animate-pulse mb-4" />
        <p className="font-serif italic">Cargando censo nominal...</p>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="bg-white border border-[#141414]/10 rounded-2xl p-20 text-center">
        <div className="w-16 h-16 bg-[#E4E3E0] rounded-full flex items-center justify-center mx-auto mb-6">
          <User className="w-8 h-8 opacity-20" />
        </div>
        <h3 className="text-2xl font-bold tracking-tight mb-2">No hay registros</h3>
        <p className="opacity-50 max-w-xs mx-auto">
          {isHistoricalView
            ? "No hay pacientes en el repositorio histórico."
            : "Comienza agregando una nueva paciente al censo nominal materno."}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#141414]/10 rounded-2xl overflow-hidden shadow-sm">
      <div className="grid grid-cols-12 bg-[#141414] text-[#E4E3E0] p-4 text-[10px] uppercase tracking-widest font-bold items-center">
        <button 
          onClick={() => handleSort('folio')}
          className="col-span-2 flex items-center gap-2 hover:text-white transition-colors text-left"
        >
          <div className="w-2 h-2 rounded-full bg-white/20" />
          Folio
          <SortIndicator column="folio" />
        </button>
        <button 
          onClick={() => handleSort('nombre')}
          className="col-span-3 flex items-center gap-2 hover:text-white transition-colors text-left"
        >
          Nombre
          <SortIndicator column="nombre" />
        </button>
        <div className="col-span-2 flex items-center gap-2 relative">
          <button 
            onClick={() => handleSort('condicion')}
            className="hover:text-white transition-colors flex items-center gap-2"
          >
            Condición
            <SortIndicator column="condicion" />
          </button>
          <button 
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className={cn("p-1 rounded hover:bg-white/10 transition-all", filterCondicion && "bg-white/20 text-white")}
          >
            <FilterIcon className="w-3 h-3" />
          </button>
          
          {showFilterMenu && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-white text-[#141414] rounded-xl shadow-2xl border border-[#141414]/10 z-50 p-2 animate-in zoom-in-95 duration-200">
              <p className="text-[8px] uppercase tracking-widest opacity-40 p-2 font-bold">Filtrar por condición</p>
              <button onClick={() => { setFilterCondicion(''); setShowFilterMenu(false); }} className={cn("w-full text-left p-2 rounded-lg text-[10px] font-bold uppercase tracking-wider", !filterCondicion ? "bg-[#141414] text-white" : "hover:bg-[#E4E3E0]")}>TODOS</button>
              <button onClick={() => { setFilterCondicion('EMBARAZADA DE PRIMERA VEZ'); setShowFilterMenu(false); }} className={cn("w-full text-left p-2 rounded-lg text-[10px] font-bold uppercase tracking-wider", filterCondicion === 'EMBARAZADA DE PRIMERA VEZ' ? "bg-[#141414] text-white" : "hover:bg-[#E4E3E0]")}>EMB. 1RA VEZ</button>
              <button onClick={() => { setFilterCondicion('EMBARAZADA SUBSECUENTE'); setShowFilterMenu(false); }} className={cn("w-full text-left p-2 rounded-lg text-[10px] font-bold uppercase tracking-wider", filterCondicion === 'EMBARAZADA SUBSECUENTE' ? "bg-[#141414] text-white" : "hover:bg-[#E4E3E0]")}>EMB. SUBSECUENTE</button>
              <button onClick={() => { setFilterCondicion('PUERPERA DE PRIMERA VEZ'); setShowFilterMenu(false); }} className={cn("w-full text-left p-2 rounded-lg text-[10px] font-bold uppercase tracking-wider", filterCondicion === 'PUERPERA DE PRIMERA VEZ' ? "bg-[#141414] text-white" : "hover:bg-[#E4E3E0]")}>PUERP. 1RA VEZ</button>
              <button onClick={() => { setFilterCondicion('PUERPERA SUBSECUENTE'); setShowFilterMenu(false); }} className={cn("w-full text-left p-2 rounded-lg text-[10px] font-bold uppercase tracking-wider", filterCondicion === 'PUERPERA SUBSECUENTE' ? "bg-[#141414] text-white" : "hover:bg-[#E4E3E0]")}>PUERP. SUBSECUENTE</button>
            </div>
          )}
        </div>
        <button 
          onClick={() => handleSort('age')}
          className="col-span-1 flex items-center gap-2 hover:text-white transition-colors text-left"
        >
          Edad
          <SortIndicator column="age" />
        </button>
        <button 
          onClick={() => handleSort('sdg')}
          className="col-span-1 flex items-center gap-2 hover:text-white transition-colors text-left"
        >
          SDG
          <SortIndicator column="sdg" />
        </button>
        <div className="col-span-1 flex items-center gap-2 relative">
          <button 
            onClick={() => handleSort('tam')}
            className="hover:text-white transition-colors flex items-center gap-1"
          >
            TAM
            <SortIndicator column="tam" />
          </button>
          <button 
            onClick={() => setShowTamFilterMenu(!showTamFilterMenu)}
            className={cn("p-1 rounded hover:bg-white/10 transition-all", filterTam && "bg-white/20 text-white")}
          >
            <FilterIcon className="w-3 h-3" />
          </button>
          
          {showTamFilterMenu && (
            <div className="absolute top-full right-0 mt-2 w-32 bg-white text-[#141414] rounded-xl shadow-2xl border border-[#141414]/10 z-50 p-2 animate-in zoom-in-95 duration-200">
              <p className="text-[8px] uppercase tracking-widest opacity-40 p-2 font-bold">Filtrar TAM</p>
              <button onClick={() => { setFilterTam(''); setShowTamFilterMenu(false); }} className={cn("w-full text-left p-2 rounded-lg text-[10px] font-bold uppercase tracking-wider", !filterTam ? "bg-[#141414] text-white" : "hover:bg-[#E4E3E0]")}>TODAS</button>
              <button onClick={() => { setFilterTam('NORMAL'); setShowTamFilterMenu(false); }} className={cn("w-full text-left p-2 rounded-lg text-[10px] font-bold uppercase tracking-wider", filterTam === 'NORMAL' ? "bg-[#141414] text-white" : "hover:bg-[#E4E3E0]")}>NORMAL (≤95)</button>
              <button onClick={() => { setFilterTam('ELEVADA'); setShowTamFilterMenu(false); }} className={cn("w-full text-left p-2 rounded-lg text-[10px] font-bold uppercase tracking-wider", filterTam === 'ELEVADA' ? "bg-red-600 text-white" : "hover:bg-red-50 text-red-600")}>ELEVADA {'>'}95</button>
            </div>
          )}
        </div>
        <button 
          onClick={() => handleSort('days')}
          className="col-span-1 flex items-center gap-1 hover:text-white transition-colors text-left"
        >
          Última
          <SortIndicator column="days" />
        </button>
        <div className="col-span-1 text-right">Acción</div>
      </div>

      <div className="divide-y divide-[#141414]/5">
        {sortedRecords.map((record, index) => {
          const age = calculateAge(record.fecha_nacimiento);
          const sdg = calculateSDG(record.fum);
          const daysSinceUpdate = calculateDaysSinceUpdate(record.fecha_ultima_consulta);
          const tam = (record.tas && record.tad) ? Math.round((record.tas + 2 * record.tad) / 3) : null;
          const isHighRiskTam = tam !== null && tam > 95;

          const prevRecord = index > 0 ? records[index - 1] : null;
          const showNucleoHeader = !prevRecord || prevRecord.nucleo_nombre !== record.nucleo_nombre;
          const showUnitHeader = user?.role === 'ADMIN' && (!prevRecord || prevRecord.health_unit_id !== record.health_unit_id);

          const getRiskColor = (score: number) => {
            if (score <= 3) return 'bg-emerald-500';
            if (score <= 6) return 'bg-amber-500';
            return 'bg-red-500';
          };

          return (
            <React.Fragment key={record.id}>
              {user?.role === 'ADMIN' && (!prevRecord || prevRecord.estado_name !== record.estado_name) && (
                <div className="bg-[#141414] px-4 py-3 border-y border-white/10 flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-[#B38E5D] rounded-full" />
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-white">
                    Estado: {record.estado_name || 'Sin Asignar'}
                  </span>
                </div>
              )}
              {(user?.role === 'ADMIN' || user?.role === 'ESTATAL') && (!prevRecord || prevRecord.region_name !== record.region_name) && (
                <div className="bg-[#141414]/90 px-4 py-2 border-y border-white/5 flex items-center gap-2">
                  <div className="w-1 h-3 bg-[#B38E5D]/60 rounded-full ml-2" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/80">
                    Región: {record.region_name || 'Sin Asignar'}
                  </span>
                </div>
              )}
              {(user?.role === 'ADMIN' || user?.role === 'ESTATAL' || user?.role === 'REGIONAL') && (!prevRecord || prevRecord.zona_name !== record.zona_name) && (
                <div className="bg-[#141414]/80 px-4 py-2 border-y border-white/5 flex items-center gap-2">
                  <div className="w-1 h-2 bg-[#B38E5D]/40 rounded-full ml-4" />
                  <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-white/60">
                    Zona: {record.zona_name || 'Sin Asignar'}
                  </span>
                </div>
              )}
              {showUnitHeader && (
                <div className="bg-[#141414]/70 px-4 py-2 border-y border-white/5 flex items-center gap-2">
                  <div className="w-1 h-1.5 bg-white/20 rounded-full ml-6" />
                  <span className="text-[8px] font-bold uppercase tracking-widest text-white/40">
                    Unidad: {record.health_unit_name || record.health_unit_id || 'Sin Asignar'}
                  </span>
                </div>
              )}
              {showNucleoHeader && (
                <div className="bg-[#E4E3E0]/50 px-4 py-2 border-y border-[#141414]/10 flex items-center gap-2">
                  <div className="w-1 h-1 bg-[#141414]/10 rounded-full ml-8" />
                  <span className="text-[8px] font-bold uppercase tracking-widest text-[#141414]/40">
                    Núcleo: {record.nucleo_nombre || 'Sin Asignar'}
                  </span>
                </div>
              )}
              <div
                onClick={() => onSelect(record)}
                className="grid grid-cols-12 p-4 items-center hover:bg-[#E4E3E0]/30 cursor-pointer transition-all group"
              >
                <div className="col-span-2 font-mono text-xs font-bold flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", getRiskColor(record.riesgo_obstetrico || 0))} title="Riesgo Obstétrico" />
                  {record.folio}
                </div>
                <div className="col-span-3">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm truncate">{record.nombre}</p>
                    {Number(record.is_historical) === 1 && (
                      <span className="text-[8px] bg-amber-100 text-amber-700 px-1 rounded uppercase font-bold">Histórico</span>
                    )}
                  </div>
                  <p className="text-[10px] opacity-40 truncate">{record.curp}</p>
                </div>
                <div className="col-span-2">
                  <span className={cn(
                    "text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider",
                    record.condicion.startsWith('EMBARAZADA') ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                  )}>
                    {record.condicion}
                  </span>
                </div>
                <div className="col-span-1 font-mono text-sm">
                  {age}
                  {age < 15 && <AlertCircle className="inline ml-1 w-3 h-3 text-red-600" />}
                </div>
                <div className="col-span-1 font-mono text-sm">
                  {record.condicion.startsWith('EMBARAZADA') ? sdg : '---'}
                </div>
                <div className="col-span-1 font-mono text-xs flex items-center gap-1">
                  {tam !== null ? (
                    <>
                      <span className={cn(isHighRiskTam && "text-red-600 font-bold")}>{tam}</span>
                      {isHighRiskTam && <AlertCircle className="w-3 h-3 inline text-red-600" title="TAM elevada (>95 mmHg)" />}
                    </>
                  ) : (
                    <span className="opacity-30">---</span>
                  )}
                </div>
                <div className="col-span-1 flex items-center gap-1.5 overflow-hidden">
                  <Clock className={cn("flex-shrink-0 w-3 h-3", daysSinceUpdate > 30 ? "text-red-500" : "opacity-30")} />
                  <span className={cn("text-[10px] font-mono truncate", daysSinceUpdate > 30 && "text-red-600 font-bold")}>
                    {daysSinceUpdate} d
                  </span>
                </div>
                <div className="col-span-1 text-right flex items-center justify-end gap-2">

                  {isHistoricalView && onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(record.id!);
                      }}
                      className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-all"
                      title="Eliminar Permanentemente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  {isHistoricalView ? (
                    onRestore && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRestore(record.id!);
                        }}
                        className="p-2 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-all"
                        title="Restaurar al Censo Activo"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    )
                  ) : (
                    onArchive && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onArchive(record.id!);
                        }}
                        className="p-2 hover:bg-amber-100 text-amber-600 rounded-lg transition-all"
                        title="Mover al Histórico"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    )
                  )}
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
