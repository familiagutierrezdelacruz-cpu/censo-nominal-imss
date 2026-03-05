import React from 'react';
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
  Trash2
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
      <div className="grid grid-cols-12 bg-[#141414] text-[#E4E3E0] p-4 text-[10px] uppercase tracking-widest font-bold">
        <div className="col-span-2 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-white/20" />
          Folio
        </div>
        <div className="col-span-3">Nombre</div>
        <div className="col-span-2">Condición</div>
        <div className="col-span-1">Edad</div>
        <div className="col-span-1">SDG</div>
        <div className="col-span-2">Última Act.</div>
        <div className="col-span-1 text-right">Acción</div>
      </div>

      <div className="divide-y divide-[#141414]/5">
        {records.map((record, index) => {
          const age = calculateAge(record.fecha_nacimiento);
          const sdg = calculateSDG(record.fum);
          const daysSinceUpdate = calculateDaysSinceUpdate(record.fecha_ultima_consulta);

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
              {showUnitHeader && (
                <div className="bg-[#141414] px-4 py-2 border-y border-white/10">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
                    Unidad de Salud: {record.health_unit_name || record.health_unit_id}
                  </span>
                </div>
              )}
              {showNucleoHeader && (
                <div className="bg-[#E4E3E0]/50 px-4 py-2 border-y border-[#141414]/10">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/60">
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
                <div className="col-span-2 flex items-center gap-2">
                  <Clock className={cn("w-3 h-3", daysSinceUpdate > 30 ? "text-red-500" : "opacity-30")} />
                  <span className={cn("text-xs font-mono", daysSinceUpdate > 30 && "text-red-600 font-bold")}>
                    {daysSinceUpdate} días
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
    </div >
  );
}
