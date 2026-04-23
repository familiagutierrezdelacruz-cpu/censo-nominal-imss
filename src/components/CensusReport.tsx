import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CensusRecord, User as UserType } from '../types/census';
import { cn } from '../utils/cn';
import { ArrowLeft, Download, Table as TableIcon, ChevronUp, ChevronDown, ListFilter, X, Search, Printer, AlertCircle, CalendarOff, ClockAlert, History } from 'lucide-react';
import * as XLSX from 'xlsx';
import { formatDate, calculateAge, calculateSDG, calculateFPP, checkCriteria, calculateDaysSinceUpdate } from '../utils/calculations';

// ─── Types ───────────────────────────────────────────────────────────────────
interface ColDef {
  key: string;
  label: string;
  get: (r: CensusRecord) => string;
  sticky?: string;
  bold?: boolean;
  center?: boolean;
  green?: boolean;
  maxW?: string;
  renderCell?: (r: CensusRecord) => React.ReactNode;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const riesgoBadge = (r: CensusRecord) => {
  const val = r.riesgo_obstetrico ?? 0;
  const cls = val <= 3 ? 'bg-emerald-100 text-emerald-700' : val <= 6 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cls}`}>{val}</span>;
};

// ─── Column Definitions ───────────────────────────────────────────────────────
const COLS: ColDef[] = [
  { key: 'folio', label: 'Folio', get: r => r.folio || '', sticky: 'left-0', bold: true },
  { key: 'folio_int', label: 'Folio Int.', get: r => r.folio_intransferible || '', sticky: 'left-[100px]', bold: true },
  { key: 'nombre', label: 'Nombre', get: r => r.nombre || '', sticky: 'left-[200px]', bold: true, maxW: '200px' },
  { key: 'curp', label: 'CURP', get: r => r.curp || '' },
  { key: 'telefono', label: 'Teléfono', get: r => r.telefono || '' },
  { key: 'domicilio', label: 'Domicilio', get: r => r.domicilio || '', maxW: '200px' },
  { key: 'tipo_localidad', label: 'Localidad', get: r => r.tipo_localidad || '' },
  { key: 'derechohabiencia', label: 'Derechohabiencia', get: r => r.derechohabiencia || '' },
  { key: 'fecha_nacimiento', label: 'F. Nacimiento', get: r => formatDate(r.fecha_nacimiento) },
  { key: 'edad', label: 'Edad', get: r => calculateAge(r.fecha_nacimiento) + ' años', center: true, bold: true },
  { key: 'fum', label: 'FUM', get: r => formatDate(r.fum) },
  { key: 'sdg', label: 'SDG Actual', get: r => calculateSDG(r.fum), center: true, bold: true, green: true },
  { key: 'fpp', label: 'FPP', get: r => formatDate(calculateFPP(r.fum)) },
  { key: 'reporte_mp', label: 'Reporte MP', get: r => r.reporte_mp || '', center: true },
  { key: 'condicion', label: 'Condición', get: r => r.condicion || '' },
  { key: 'gestas', label: 'Gestas', get: r => String(r.gestas ?? ''), center: true },
  { key: 'cesareas', label: 'Cesáreas', get: r => String(r.cesareas ?? ''), center: true },
  { key: 'fecha_ultima_cesarea', label: 'F. Últ. Cesárea', get: r => formatDate(r.fecha_ultima_cesarea) },
  { key: 'partos', label: 'Partos', get: r => String(r.partos ?? ''), center: true },
  { key: 'abortos', label: 'Abortos', get: r => String(r.abortos ?? ''), center: true },
  { key: 'fecha_ultimo_aborto', label: 'F. Últ. Aborto', get: r => formatDate(r.fecha_ultimo_aborto) },
  { key: 'riesgo_obstetrico', label: 'Riesgo Obs.', get: r => String(r.riesgo_obstetrico ?? ''), center: true, renderCell: riesgoBadge },
  { key: 'factores_riesgo', label: 'Factores Riesgo', get: r => r.factores_riesgo || '' },
  { key: 'riesgo_social', label: 'Riesgo Social', get: r => r.riesgo_social || '' },
  { key: 'salud_mental_fecha', label: 'Salud Mental F.', get: r => formatDate(r.salud_mental_fecha) },
  { key: 'salud_mental_puntaje', label: 'Salud Mental P.', get: r => String(r.salud_mental_puntaje ?? ''), center: true },
  { key: 'tas', label: 'TAS', get: r => String(r.tas ?? '') },
  { key: 'tad', label: 'TAD', get: r => String(r.tad ?? '') },
  { key: 'tamiz_dm', label: 'Tamiz DM', get: r => r.tamiz_dm || '' },
  { key: 'bh_hb', label: 'BH Hb', get: r => r.bh_hb || '' },
  { key: 'tipo_sangre', label: 'Tipo Sangre', get: r => r.tipo_sangre || '', center: true },
  { key: 'rh', label: 'Rh', get: r => r.rh || '', center: true },
  { key: 'vih_resultado', label: 'VIH', get: r => r.vih_resultado || '' },
  { key: 'vih_fecha', label: 'VIH Fecha', get: r => formatDate(r.vih_fecha) },
  { key: 'sifilis_resultado', label: 'Sífilis', get: r => r.sifilis_resultado || '' },
  { key: 'sifilis_fecha', label: 'Sífilis Fecha', get: r => formatDate(r.sifilis_fecha) },
  { key: 'ego_resultado', label: 'EGO', get: r => r.ego_resultado || '' },
  { key: 'ego_fecha', label: 'EGO Fecha', get: r => formatDate(r.ego_fecha) },
  { key: 'td_1ra', label: 'Td 1ra', get: r => formatDate(r.td_fecha_1ra) },
  { key: 'td_2da', label: 'Td 2da', get: r => formatDate(r.td_fecha_2da) },
  { key: 'td_3ra', label: 'Td 3ra', get: r => formatDate(r.td_fecha_3ra) },
  { key: 'tdpa', label: 'Tdpa', get: r => formatDate(r.tdpa_fecha) },
  { key: 'influenza', label: 'Influenza', get: r => formatDate(r.influenza_fecha) },
  { key: 'acido_folico', label: 'Ácido Fólico', get: r => r.acido_folico || '', center: true },
  { key: 'fumarato_ferroso', label: 'Fumarato', get: r => r.fumarato_ferroso || '', center: true },
  { key: 'aas', label: 'AAS', get: r => r.aas || '', center: true },
  { key: 'calcio', label: 'Calcio', get: r => r.calcio || '', center: true },
  { key: 'estado_salud_actual', label: 'Estado Salud', get: r => r.estado_salud_actual || '' },
  { key: 'fecha_usg', label: 'F. USG', get: r => formatDate(r.fecha_usg_reciente) },
  { key: 'conclusiones_usg', label: 'Conclusiones USG', get: r => r.conclusiones_usg || '' },
  { key: 'plan_seguridad', label: 'Plan Seg.', get: r => r.plan_seguridad || '', center: true },
  { key: 'plan_seguridad_fecha', label: 'Plan Seg. F.', get: r => formatDate(r.plan_seguridad_fecha) },
  { key: 'plan_manejo', label: 'Plan Manejo', get: r => r.plan_manejo || '' },
  { key: 'ref_mater_hospital', label: 'Ref. Mater Hosp.', get: r => r.ref_mater_hospital || '' },
  { key: 'ref_mater_acudio', label: 'Ref. Mater Acudió', get: r => r.ref_mater_acudio || '', center: true },
  { key: 'ref_mater_resultado', label: 'Ref. Mater Res.', get: r => r.ref_mater_resultado || '' },
  { key: 'ref_urg_hospital', label: 'Ref. Urg. Hosp.', get: r => r.ref_urgencias_hospital || '' },
  { key: 'ref_urg_acudio', label: 'Ref. Urg. Acudió', get: r => r.ref_urgencias_acudio || '', center: true },
  { key: 'ref_urg_resultado', label: 'Ref. Urg. Res.', get: r => r.ref_urgencias_resultado || '' },
  { key: 'derivacion', label: 'Ref. Plat. Com.', get: r => r.derivacion_plataforma_comunitaria || '', center: true },
  { key: 'parteria', label: 'Cont. Partería', get: r => r.control_parteria_tradicional || '', center: true },
  { key: 'nombre_partera', label: 'Nombre Partera', get: r => r.nombre_partera || '' },
  { key: 'conclusion_embarazo', label: 'Conclusión', get: r => r.conclusion_embarazo || '' },
  { key: 'sdg_nacimiento', label: 'SDG Nac.', get: r => String(r.sdg_nacimiento ?? ''), center: true },
  { key: 'fecha_atencion', label: 'F. Evento', get: r => formatDate(r.fecha_atencion_evento) },
  { key: 'lugar_atencion', label: 'Lugar Atención', get: r => r.lugar_atencion_evento || '' },
  { key: 'estado_puerperio', label: 'Salud Puerperio', get: r => r.estado_salud_materna_puerperio || '' },
  { key: 'rn_estado', label: 'RN Estado', get: r => r.rn_estado || '' },
  { key: 'rn_genero', label: 'RN Género', get: r => r.rn_genero || '' },
  { key: 'rn_salud', label: 'RN Salud', get: r => r.rn_salud || '' },
  { key: 'tamiz_met_fecha', label: 'Tamiz Met. F.', get: r => formatDate(r.tamiz_metabolico_fecha) },
  { key: 'tamiz_met_sosp', label: 'Tamiz Met. S.', get: r => r.tamiz_metabolico_sospechoso || '', center: true },
  { key: 'tamiz_aud_fecha', label: 'Tamiz Aud. F.', get: r => formatDate(r.tamiz_auditivo_fecha) },
  { key: 'tamiz_aud_sosp', label: 'Tamiz Aud. S.', get: r => r.tamiz_auditivo_sospechoso || '', center: true },
  { key: 'mpf_eleccion', label: 'MPF Elección', get: r => r.mpf_eleccion || '' },
  { key: 'mpf_aplicado', label: 'MPF Aplicado', get: r => r.mpf_aplicado || '' },
  { key: 'motivo_rechazo_mpf', label: 'Motivo Rechazo', get: r => r.motivo_rechazo_mpf || '' },
  { key: 'diagnostico', label: 'Diag. Específico', get: r => r.diagnostico_especifico || '', maxW: '200px' },
  { key: 'plan_puerperio', label: 'Plan Manejo Puerperio', get: r => r.plan_manejo_puerperio || '', maxW: '200px' },
  { key: 'club_embarazadas', label: 'Club Emb.', get: r => r.club_embarazadas || '', center: true },
  { key: 'seguimiento_ts', label: 'Seguimiento TS', get: r => r.seguimiento_ts || '' },
  { key: 'fecha_act_ts', label: 'F. Act. TS', get: r => formatDate(r.fecha_actualizacion_ts) },
  { key: 'observaciones', label: 'Observaciones Grales', get: r => r.observaciones_generales || '', maxW: '250px' },
  { key: 'fecha_ultima_consulta', label: 'F. Últ. Consulta', get: r => formatDate(r.fecha_ultima_consulta) },
  { key: 'fecha_proxima_cita', label: 'F. Próx. Cita', get: r => formatDate(r.fecha_proxima_cita) },
  { key: 'medico_atencion', label: 'Médico Atiende', get: r => r.medico_atencion || '' },
  { key: 'medico_nombre', label: 'Médico Resp.', get: r => r.medico_nombre || '' },
  { key: 'medico_cedula', label: 'Cédula Médico', get: r => r.medico_cedula || '' },
  { key: 'nucleo_nombre', label: 'Núcleo', get: r => r.nucleo_nombre || '' },
  { key: 'health_unit_name', label: 'Unidad Salud', get: r => r.health_unit_name || '' },
  { key: 'zona_name', label: 'Zona', get: r => r.zona_name || '' },
  { key: 'region_name', label: 'Región', get: r => r.region_name || '' },
  { key: 'estado_name', label: 'Estado', get: r => r.estado_name || '' },
  { key: 'created_at', label: 'F. Registro', get: r => formatDate(r.created_at || '') },
];

const PRINT_COLS = [
  { label: 'FOLIO', get: (r: CensusRecord) => r.folio || '' },
  { label: 'NOMBRE DE LA PACIENTE', get: (r: CensusRecord) => r.nombre || '' },
  { label: 'CURP', get: (r: CensusRecord) => r.curp || '' },
  { label: 'EDAD', get: (r: CensusRecord) => calculateAge(r.fecha_nacimiento) + ' a' },
  { label: 'DOMICILIO', get: (r: CensusRecord) => r.domicilio || 'No reg.' },
  { label: 'TELÉFONO', get: (r: CensusRecord) => r.telefono || '-' },
  { label: 'SDG', get: (r: CensusRecord) => calculateSDG(r.fum) },
  { label: 'FPP', get: (r: CensusRecord) => formatDate(calculateFPP(r.fum)) },
  { label: 'RIESGO', get: (r: CensusRecord) => String(r.riesgo_obstetrico || 0) },
  { label: 'CONDICIÓN', get: (r: CensusRecord) => r.condicion?.split(' ')[0] + ' ' + (r.condicion?.includes('PRIMERA') ? '1ra' : 'Sub') },
  { label: 'ÚLT. CONSULTA', get: (r: CensusRecord) => formatDate(r.fecha_ultima_consulta) },
  { label: 'PRÓX. CITA', get: (r: CensusRecord) => formatDate(r.fecha_proxima_cita) },
  { label: 'OBSERVACIONES / NOTAS CLÍNICAS', get: (r: CensusRecord) => r.observaciones_generales || r.factores_riesgo || 'Sin observaciones' },
];

// ─── FilterPopover ────────────────────────────────────────────────────────────
interface FilterPopoverProps {
  anchorEl: HTMLElement;
  values: string[];
  selected: Set<string>;
  onToggle: (v: string) => void;
  onClear: () => void;
  onClose: () => void;
}

function FilterPopover({ anchorEl, values, selected, onToggle, onClear, onClose }: FilterPopoverProps) {
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const rect = anchorEl.getBoundingClientRect();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) && !anchorEl.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose, anchorEl]);

  const filtered = values.filter(v => v.toLowerCase().includes(search.toLowerCase()));

  return createPortal(
    <div
      ref={ref}
      style={{
        position: 'fixed',
        top: rect.bottom + 4,
        left: Math.min(rect.left, window.innerWidth - 250),
        zIndex: 9999,
        width: 240,
      }}
      className="bg-white rounded-xl shadow-2xl border border-[#141414]/10 p-3"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Filtrar columna</span>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <button onClick={onClear} className="text-[10px] text-red-500 hover:text-red-700 font-bold">Limpiar</button>
          )}
          <button onClick={onClose} className="text-[#141414]/40 hover:text-[#141414]"><X className="w-3 h-3" /></button>
        </div>
      </div>
      <div className="relative mb-2">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 opacity-40" />
        <input
          type="text"
          placeholder="Buscar valor..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-6 pr-2 py-1.5 text-xs border border-[#141414]/15 rounded-lg focus:outline-none bg-[#F5F4F0]"
          autoFocus
        />
      </div>
      <div className="max-h-48 overflow-y-auto space-y-0.5">
        {filtered.length === 0 && (
          <p className="text-xs text-center opacity-40 py-2 italic">Sin valores</p>
        )}
        {filtered.map(v => (
          <label key={v} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-[#F5F4F0] p-1.5 rounded-lg">
            <input
              type="checkbox"
              checked={selected.has(v)}
              onChange={() => onToggle(v)}
              className="accent-[#141414] w-3 h-3 flex-shrink-0"
            />
            <span className="truncate">{v || '(vacío)'}</span>
          </label>
        ))}
      </div>
      {selected.size > 0 && (
        <p className="text-[10px] text-emerald-600 font-bold mt-2 text-center border-t border-[#141414]/5 pt-2">
          {selected.size} seleccionado{selected.size > 1 ? 's' : ''}
        </p>
      )}
    </div>,
    document.body
  );
}

// ─── ColHeader ────────────────────────────────────────────────────────────────
interface ColHeaderProps {
  col: ColDef;
  allRecords: CensusRecord[];
  columnFilters: Record<string, string[]>;
  setColumnFilters: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  sortCol: string | null;
  setSortCol: (col: string | null) => void;
  sortDir: 'asc' | 'desc';
  setSortDir: (dir: 'asc' | 'desc') => void;
}

function ColHeader({ col, allRecords, columnFilters, setColumnFilters, sortCol, setSortCol, sortDir, setSortDir }: ColHeaderProps) {
  const [showFilter, setShowFilter] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const uniqueValues = useMemo(() => {
    const set = new Set(allRecords.map(r => col.get(r)));
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [allRecords, col]);

  const selected = useMemo(() => new Set(columnFilters[col.key] || []), [columnFilters, col.key]);
  const isFiltered = selected.size > 0;
  const isSortedAsc = sortCol === col.key && sortDir === 'asc';
  const isSortedDesc = sortCol === col.key && sortDir === 'desc';

  const handleSort = () => {
    if (sortCol === col.key) {
      if (sortDir === 'asc') setSortDir('desc');
      else { setSortCol(null); }
    } else {
      setSortCol(col.key);
      setSortDir('asc');
    }
  };

  const handleToggle = (v: string) => {
    setColumnFilters(prev => {
      const current = new Set(prev[col.key] || []);
      if (current.has(v)) current.delete(v); else current.add(v);
      return { ...prev, [col.key]: Array.from(current) };
    });
  };

  return (
    <th
      className={`p-0 border-r border-white/10 text-[10px] uppercase tracking-widest font-bold bg-[#141414] text-[#E4E3E0] print:bg-white print:text-black print:border-[#141414]/20 ${col.sticky ? `sticky ${col.sticky} z-20 print:relative print:sticky-none` : ''}`}
      style={{ position: 'relative' }}
    >
      <div className="flex items-center gap-1 px-3 py-3 whitespace-nowrap min-w-[80px] print:px-1 print:py-2">
        <button onClick={handleSort} className="flex items-center gap-1 hover:opacity-70 transition-opacity text-left flex-1">
          <span>{col.label}</span>
          <span className="flex flex-col ml-1 opacity-40">
            <ChevronUp className={`w-2.5 h-2.5 -mb-0.5 transition-colors ${isSortedAsc ? 'opacity-100 text-amber-400' : ''}`} />
            <ChevronDown className={`w-2.5 h-2.5 transition-colors ${isSortedDesc ? 'opacity-100 text-amber-400' : ''}`} />
          </span>
        </button>
        <button
          ref={btnRef}
          onClick={() => setShowFilter(s => !s)}
          className={`flex-shrink-0 p-0.5 rounded transition-all ${isFiltered ? 'text-emerald-400 bg-emerald-400/20' : 'opacity-30 hover:opacity-80'}`}
        >
          <ListFilter className="w-3 h-3" />
        </button>
      </div>
      {showFilter && btnRef.current && (
        <FilterPopover
          anchorEl={btnRef.current}
          values={uniqueValues}
          selected={selected}
          onToggle={handleToggle}
          onClear={() => setColumnFilters(prev => ({ ...prev, [col.key]: [] }))}
          onClose={() => setShowFilter(false)}
        />
      )}
    </th>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface CensusReportProps {
  records: CensusRecord[];
  user: UserType | null;
  onBack: () => void;
}

export default function CensusReport({ records, user, onBack }: CensusReportProps) {
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const hasFilters = Object.values(columnFilters).some(v => v.length > 0);
  const activeFilterCount = Object.values(columnFilters).reduce((acc, v) => acc + (v.length > 0 ? 1 : 0), 0);

  const clearAllFilters = () => { 
    setColumnFilters({}); 
    setSortCol(null); 
  };

  const displayRecords = useMemo(() => {
    let result = records.filter(record => {
      // Column filtering
      return Object.entries(columnFilters).every(([key, vals]) => {
        if (!vals || vals.length === 0) return true;
        const col = COLS.find(c => c.key === key);
        if (!col) return true;
        return vals.includes(col.get(record));
      });
    });
    if (sortCol) {
      const col = COLS.find(c => c.key === sortCol);
      if (col) {
        result = [...result].sort((a, b) => {
          const va = col.get(a), vb = col.get(b);
          const cmp = va.localeCompare(vb, undefined, { numeric: true });
          return sortDir === 'asc' ? cmp : -cmp;
        });
      }
    }
    return result;
  }, [records, columnFilters, sortCol, sortDir]);

  const exportToExcel = () => {
    const dataToExport = displayRecords.map(record => {
      const row: Record<string, string> = {};
      COLS.forEach(col => { row[col.label] = col.get(record); });
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Censo Nominal');
    XLSX.writeFile(wb, `Censo_Nominal_Sabana_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleQuickExcel = (type: string) => {
    const filtered = records.filter(r => checkCriteria(r, type));
    const dataToExport = filtered.map(record => {
      const row: Record<string, string> = {};
      COLS.forEach(col => { row[col.label] = col.get(record); });
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte Crítico');
    XLSX.writeFile(wb, `Reporte_${type}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const [printType, setPrintType] = useState<string | null>(null);
  
  const handleQuickPrint = (type: string) => {
    setPrintType(type);
    setTimeout(() => {
      window.print();
      setPrintType(null);
    }, 100);
  };

  const SHORTCUTS = [
    { id: 'sdg_41', label: 'Término Pre-Prolongado', sub: '> 41 SDG', icon: ClockAlert, color: 'bg-red-500' },
    { id: 'sdg_37_40', label: 'Control de Término', sub: '37 a 40.6 SDG', icon: ClockAlert, color: 'bg-emerald-500' },
    { id: 'no_update', label: 'Sin Actualización', sub: '> 30 Días', icon: History, color: 'bg-amber-500' },
    { id: 'missed_apt', label: 'Citas Vencidas', sub: 'No Asistió', icon: CalendarOff, color: 'bg-orange-500' },
    { id: 'cesarea_38', label: 'Cesárea Previa', sub: '> 38 SDG', icon: AlertCircle, color: 'bg-rose-500' },
  ];

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-[#141414]/5 rounded-full transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-serif italic flex items-center gap-2">
              <TableIcon className="w-6 h-6" />
              Reporte Sábana
            </h2>
            <p className="text-xs opacity-50 uppercase tracking-widest font-bold">
              Vista completa: {user?.health_unit_name || 'Todas las Unidades'} &mdash;&nbsp;
              <span className={hasFilters ? 'text-emerald-600 opacity-100' : ''}>
                {displayRecords.length} de {records.length} registros
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {hasFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1.5 text-xs border border-red-200 text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg font-bold transition-all"
            >
              <X className="w-3 h-3" />
              Limpiar {activeFilterCount} filtro{activeFilterCount > 1 ? 's' : ''}
            </button>
          )}
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700 transition-all shadow-sm active:scale-95 no-print"
          >
            <Download className="w-4 h-4" />
            EXPORTAR A EXCEL
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-[#141414] text-[#E4E3E0] px-6 py-2 rounded-lg text-sm font-bold hover:bg-[#141414]/90 transition-all shadow-sm active:scale-95 no-print"
          >
            <Printer className="w-4 h-4" />
            IMPRIMIR REPORTE
          </button>
        </div>
      </div>

      {/* ── Shortcuts ── */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 no-print">
        {SHORTCUTS.map(s => {
          const Icon = s.icon;
          const count = records.filter(r => checkCriteria(r, s.id)).length;
          return (
            <div
              key={s.id}
              className="bg-white p-5 rounded-3xl border border-[#141414]/10 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all h-full"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={cn("p-2.5 rounded-2xl text-white", s.color)}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-2xl font-mono font-bold">{count}</span>
                  <span className="text-[9px] uppercase tracking-widest font-bold opacity-40">Pacientes</span>
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="font-bold text-sm tracking-tight leading-tight mb-1">{s.label}</h4>
                <p className="text-[10px] opacity-50 font-medium">{s.sub}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleQuickPrint(s.id)}
                  className="flex items-center justify-center gap-2 bg-[#141414] text-[#E4E3E0] py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-[#141414]/90 transition-all active:scale-95 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimir
                </button>
                <button
                  onClick={() => handleQuickExcel(s.id)}
                  className="flex items-center justify-center gap-2 bg-emerald-600 text-white py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all active:scale-95 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  Excel
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Active Filters Pills ── */}
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
          <span className="text-xs font-bold text-amber-800">Filtros activos:</span>
          {Object.entries(columnFilters).filter(([, v]) => v.length > 0).map(([key, vals]) => {
            const col = COLS.find(c => c.key === key);
            return (
              <span key={key} className="flex items-center gap-1 text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-medium border border-amber-200">
                <span className="font-bold">{col?.label}:</span>
                {vals.length === 1 ? vals[0] : `${vals.length} valores`}
                <button onClick={() => setColumnFilters(prev => ({ ...prev, [key]: [] }))} className="ml-0.5 hover:text-red-600">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* ── Official Print Header (Visible ONLY in Print) ── */}
      <div className="hidden print:block mb-8">
        <div className="flex justify-between items-start border-b-4 border-[#005944] pb-4 mb-6">
          <div className="flex gap-4 items-center">
            <div className="w-16 h-16 border-2 border-[#005944] flex items-center justify-center p-1 text-[#005944] font-black text-xl">
              IMSS
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#005944] tracking-tighter">IMSS-BIENESTAR</h1>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Servicios Públicos de Salud &mdash; {user?.estado_name || records[0]?.estado_name || 'ESTATAL'}</p>
              <h2 className="text-lg font-serif italic text-[#B38E5D]">Censo Nominal de Salud Materna</h2>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase opacity-40">Expedido el:</p>
            <p className="text-sm font-mono font-bold">{new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 bg-[#141414]/5 p-4 rounded-xl border border-[#141414]/10 mb-6">
          <div>
            <p className="text-[8px] uppercase tracking-widest font-bold opacity-50 mb-1">Unidad de Salud</p>
            <p className="text-xs font-bold uppercase">{user?.health_unit_name || records[0]?.health_unit_name || '---'}</p>
          </div>
          <div>
            <p className="text-[8px] uppercase tracking-widest font-bold opacity-50 mb-1">Clave CLUES</p>
            <p className="text-xs font-bold font-mono uppercase">{user?.health_unit_clues || records[0]?.health_unit_clues || '---'}</p>
          </div>
          <div>
            <p className="text-[8px] uppercase tracking-widest font-bold opacity-50 mb-1">Tipo de Reporte</p>
            <p className="text-xs font-bold uppercase text-[#005944]">
              {printType 
                ? `CRÍTICO: ${SHORTCUTS.find(s => s.id === printType)?.label.toUpperCase()}` 
                : 'SÁBANA NOMINAL GENERAL'
              }
            </p>
          </div>
        </div>

        <div className="flex justify-between items-end border-b border-[#141414]/10 pb-2 mb-4">
          <div className="flex gap-4 text-[9px] font-bold opacity-60">
            <span>REGIÓN: {user?.region_name || records[0]?.region_name || '---'}</span>
            <span>ZONA: {user?.zona_name || records[0]?.zona_name || '---'}</span>
          </div>
          <p className="text-[10px] font-bold">Total de pacientes en este reporte: <span className="bg-[#141414] text-white px-2 py-0.5 rounded ml-1 font-mono">{printType ? records.filter(r => checkCriteria(r, printType)).length : displayRecords.length}</span></p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: landscape; margin: 10mm; }
          body { background: white !important; }
          .print-table th, .print-table td { border: 1px solid #e5e7eb !important; padding: 6px 8px !important; }
        }
      ` }} />

      {/* ── Main Table (Hidden in Print) ── */}
      <div className="bg-white border border-[#141414]/10 rounded-2xl overflow-hidden shadow-sm print:hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr>
                {COLS.map(col => (
                  <ColHeader
                    key={col.key}
                    col={col}
                    allRecords={records}
                    columnFilters={columnFilters}
                    setColumnFilters={setColumnFilters}
                    sortCol={sortCol}
                    setSortCol={setSortCol}
                    sortDir={sortDir}
                    setSortDir={setSortDir}
                  />
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#141414]/5">
              {(() => {
                const finalRecords = printType ? records.filter(r => checkCriteria(r, printType)) : displayRecords;
                
                if (finalRecords.length === 0) {
                  return (
                    <tr>
                      <td colSpan={COLS.length} className="p-12 text-center text-sm opacity-40 italic">
                        No se encontraron registros.
                      </td>
                    </tr>
                  );
                }

                return finalRecords.map((record, index) => {
                  const prev = index > 0 ? finalRecords[index - 1] : null;
                  const showGroup = !sortCol && (!prev || prev.nucleo_nombre !== record.nucleo_nombre);
                  return (
                    <React.Fragment key={record.id}>
                      {showGroup && (
                        <tr className="bg-[#E4E3E0] font-bold text-[10px] uppercase tracking-widest">
                          <td colSpan={COLS.length} className="p-2 px-4 sticky left-0 bg-[#E4E3E0]">
                            Núcleo: {record.nucleo_nombre || 'Sin Asignar'}
                          </td>
                        </tr>
                      )}
                      <tr className="hover:bg-[#E4E3E0]/30 transition-all text-xs font-mono group">
                        {COLS.map(col => {
                          const isSticky = !!col.sticky;
                          const tdClass = [
                            'p-4 border-r border-[#141414]/5',
                            isSticky ? `sticky ${col.sticky} bg-white group-hover:bg-[#E4E3E0]/30` : '',
                            col.bold ? 'font-bold' : '',
                            col.center ? 'text-center' : '',
                            col.green ? 'font-bold text-emerald-700' : '',
                            col.maxW ? `truncate` : '',
                          ].filter(Boolean).join(' ');
                          return (
                            <td key={col.key} className={tdClass} style={col.maxW ? { maxWidth: col.maxW } : undefined}>
                              {col.renderCell ? col.renderCell(record) : col.get(record)}
                            </td>
                          );
                        })}
                      </tr>
                    </React.Fragment>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Dedicated Print Table (Visible ONLY in Print) ── */}
      <div className="hidden print:block">
        <table className="w-full text-left border-collapse print-table">
          <thead>
            <tr className="bg-[#141414]/5">
              {PRINT_COLS.map((col, i) => (
                <th key={i} className="p-2 border border-[#141414]/20 text-[9px] font-bold uppercase tracking-tighter">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(printType ? records.filter(r => checkCriteria(r, printType)) : displayRecords).map((record, index) => (
              <tr key={record.id} className="border-b border-[#141414]/10 text-[9px] font-mono">
                {PRINT_COLS.map((col, i) => (
                  <td key={i} className="p-2 border border-[#141414]/10">
                    {col.get(record)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="hidden print:block mt-12 pb-20 no-break" style={{ breakInside: 'avoid' }}>
        <div className="grid grid-cols-2 gap-20">
          <div className="text-center pt-8 border-t border-[#141414]">
            <p className="text-[10px] font-bold uppercase tracking-widest">MÉDICO RESPONSABLE DE INFORMACIÓN</p>
            <p className="text-[8px] uppercase tracking-wider opacity-60">Nombre y Firma</p>
          </div>
          <div className="text-center pt-8 border-t border-[#141414]">
            <p className="text-[10px] font-bold uppercase tracking-widest">DIRECTOR(A) DE LA UNIDAD / RESPONSABLE MÉDICO</p>
            <p className="text-[8px] uppercase tracking-wider opacity-60">Nombre y Firma</p>
          </div>
        </div>
        <div className="mt-12 text-center text-[8px] opacity-40 uppercase tracking-[0.3em]">
          IMSS-BIENESTAR - SISTEMA DE CONTROL MATERNO V1.0 - DOCUMENTO DE USO OFICIAL
        </div>
      </div>
    </div>
  );
}
