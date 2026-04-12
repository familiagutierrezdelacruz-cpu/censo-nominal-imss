import React, { useState, useEffect } from 'react';
import { CensusRecord, Nucleo, User as UserType, HealthUnit } from '../types/census';
import {
  calculateAge,
  calculateSDG,
  calculateFPP,
  calculateTAM,
  calculatePuerperioDays,
  getVaccineAlerts
} from '../utils/calculations';
import { Save, X, AlertCircle, User, Calendar, Activity, Stethoscope } from 'lucide-react';
import { cn } from '../utils/cn';

interface InputGroupProps {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  options?: { value: string; label: string }[] | null;
  placeholder?: string;
  value: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

const InputGroup = ({ label, name, type = "text", required = false, options = null, placeholder = "", value, onChange }: InputGroupProps) => (
  <div className="space-y-1.5">
    <label className="text-[10px] uppercase tracking-[0.15em] text-[#141414]/40 font-bold block">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {options ? (
      <select
        name={name}
        value={value as string}
        onChange={onChange}
        className="w-full bg-transparent border-b-2 border-[#141414]/10 px-0 py-1 text-sm font-mono font-bold focus:outline-none focus:border-[#141414] transition-all appearance-none cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    ) : type === 'textarea' ? (
      <textarea
        name={name}
        placeholder={placeholder}
        value={value as any}
        onChange={onChange}
        rows={3}
        className="w-full bg-transparent border-b-2 border-[#141414]/10 px-0 py-1 text-sm font-mono font-bold focus:outline-none focus:border-[#141414] transition-all placeholder:font-normal placeholder:opacity-30 resize-none"
      />
    ) : (
      <input
        type={type}
        name={name}
        placeholder={type === 'date' ? 'dd/mm/aaaa' : placeholder}
        lang={type === 'date' ? 'es-ES' : undefined}
        value={value as any}
        onChange={onChange}
        className="w-full bg-transparent border-b-2 border-[#141414]/10 px-0 py-1 text-sm font-mono font-bold focus:outline-none focus:border-[#141414] transition-all placeholder:font-normal placeholder:opacity-30"
      />
    )}
  </div>
);

interface CensusFormProps {
  onSave: (data: CensusRecord) => void;
  onCancel: () => void;
  initialData?: CensusRecord | null;
  token: string;
}

export default function CensusForm({ onSave, onCancel, initialData, token }: CensusFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserType | null>(() => {
    try {
      return JSON.parse(localStorage.getItem('census_user') || 'null');
    } catch {
      return null;
    }
  });
  const [units, setUnits] = useState<HealthUnit[]>([]);
  const defaultData: Partial<CensusRecord> = {
    nombre: '',
    curp: '',
    telefono: '',
    domicilio: '',
    reporte_mp: '',
    folio_intransferible: '',
    tipo_localidad: 'SEDE',
    derechohabiencia: '',
    condicion: 'EMBARAZADA DE PRIMERA VEZ',
    gestas: 0,
    cesareas: 0,
    fecha_ultima_cesarea: '',
    partos: 0,
    abortos: 0,
    fecha_ultimo_aborto: '',
    fum: '',
    riesgo_obstetrico: 0,
    factores_riesgo: '',
    riesgo_social: '',
    salud_mental_fecha: '',
    salud_mental_puntaje: 0,
    tas: 110,
    tad: 70,
    td_fecha_1ra: '',
    td_fecha_2da: '',
    td_fecha_3ra: '',
    tdpa_fecha: '',
    influenza_fecha: '',
    tamiz_dm: '',
    bh_hb: '',
    tipo_sangre: '',
    rh: '',
    vih_resultado: '',
    vih_fecha: '',
    sifilis_resultado: '',
    sifilis_fecha: '',
    ego_resultado: '',
    ego_fecha: '',
    acido_folico: 'N',
    fumarato_ferroso: 'N',
    aas: 'N',
    calcio: 'N',
    estado_salud_actual: '',
    plan_seguridad: 'N',
    plan_seguridad_fecha: '',
    plan_manejo: '',
    ref_mater_hospital: '',
    ref_mater_acudio: '',
    ref_mater_resultado: '',
    ref_urgencias_hospital: '',
    ref_urgencias_acudio: '',
    ref_urgencias_resultado: '',
    derivacion_plataforma_comunitaria: 'N',
    control_parteria_tradicional: 'N',
    nombre_partera: '',
    conclusion_embarazo: '',
    sdg_nacimiento: 0,
    fecha_atencion_evento: '',
    lugar_atencion_evento: '',
    estado_salud_materna_puerperio: '',
    rn_estado: '',
    rn_genero: '',
    rn_salud: '',
    tamiz_metabolico_fecha: '',
    tamiz_metabolico_sospechoso: '',
    tamiz_auditivo_fecha: '',
    tamiz_auditivo_sospechoso: '',
    mpf_eleccion: '',
    mpf_aplicado: '',
    motivo_rechazo_mpf: '',
    diagnostico_especifico: '',
    plan_manejo_puerperio: '',
    club_embarazadas: 'N',
    seguimiento_ts: '',
    fecha_actualizacion_ts: '',
    fecha_ultima_consulta: '',
    fecha_proxima_cita: '',
    medico_nombre: '',
    medico_cedula: '',
    medico_atencion: '',
    nucleo_nombre: '',
    fecha_usg_reciente: '',
    conclusiones_usg: '',
    observaciones_generales: '',
  };

  const [formData, setFormData] = useState<Partial<CensusRecord>>({
    ...defaultData,
    health_unit_id: user?.health_unit_id || undefined,
    ...initialData
  });

  const [nucleos, setNucleos] = useState<Nucleo[]>([]);

  useEffect(() => {
    // If we're editing, ensure the record's unit is preserved
    if (initialData?.health_unit_id) {
      setFormData(prev => ({ ...prev, health_unit_id: initialData.health_unit_id }));
    }
  }, [initialData]);

  useEffect(() => {
    const fetchNucleos = async () => {
      try {
        const response = await fetch('/api/nucleos', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setNucleos(data);
      } catch (error) {
        console.error('Error fetching nucleos:', error);
      }
    };

    const fetchUnits = async () => {
      if (user?.role !== 'ADMIN' || user?.health_unit_id) return; // Don't fetch if already assigned
      try {
        const response = await fetch('/api/admin/units', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setUnits(data);
      } catch (error) {
        console.error('Error fetching units:', error);
      }
    };

    fetchNucleos();
    fetchUnits();
  }, [token, user]);

  const handleNucleoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nucleoNombre = e.target.value;
    const selectedNucleo = nucleos.find(n => n.nombre === nucleoNombre);

    if (selectedNucleo) {
      setFormData(prev => ({
        ...prev,
        nucleo_nombre: selectedNucleo.nombre,
        medico_nombre: selectedNucleo.medico_nombre,
        medico_cedula: selectedNucleo.medico_cedula
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        nucleo_nombre: '',
        medico_nombre: '',
        medico_cedula: ''
      }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    let processedValue: any = value;
    if (type === 'number') {
      processedValue = value === '' ? 0 : parseFloat(value);
    } else if (name === 'riesgo_obstetrico') {
      processedValue = parseInt(value, 10);
    } else if (name === 'health_unit_id') {
      processedValue = value === '' ? undefined : parseInt(value, 10);
    }

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre || !formData.fecha_nacimiento) {
      setError('Nombre y Fecha de Nacimiento son obligatorios');
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Validation for Admin Global (no unit assigned in session)
    if (user?.role === 'ADMIN' && !user?.health_unit_id && !formData.health_unit_id) {
      setError('Debe asignar una unidad de salud para este registro');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formData as CensusRecord);
    } finally {
      setIsSaving(false);
    }
  };

  const age = calculateAge(formData.fecha_nacimiento || '');
  const sdg = calculateSDG(formData.fum || '');
  const fpp = calculateFPP(formData.fum || '');
  const tam = calculateTAM(formData.tas || 0, formData.tad || 0);
  const puerperioDays = calculatePuerperioDays(formData.fecha_atencion_evento || '');

  const getRiskLevel = (score: number) => {
    if (score <= 3) return { label: 'Bajo Riesgo', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    if (score <= 6) return { label: 'Riesgo Moderado', color: 'bg-amber-100 text-amber-700 border-amber-200' };
    return { label: 'Alto Riesgo', color: 'bg-red-100 text-red-700 border-red-200' };
  };

  const riskInfo = getRiskLevel(formData.riesgo_obstetrico || 0);

  const renderInput = (label: string, name: keyof CensusRecord, type = "text", required = false, options = null, placeholder = "") => (
    <InputGroup
      label={label}
      name={name}
      type={type}
      required={required}
      options={options}
      placeholder={placeholder}
      value={formData[name] ?? ''}
      onChange={handleChange}
    />
  );

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto pb-20 relative">
      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-xl text-sm font-bold flex items-center gap-2 sticky top-0 z-10 shadow-md">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}
      {/* Sticky Header Actions */}
      <div className="sticky top-0 z-40 bg-[#E4E3E0]/95 backdrop-blur-sm py-4 mb-8 border-b border-[#141414]/10 flex flex-col md:flex-row gap-3">
        <button
          type="submit"
          disabled={isSaving}
          className={cn(
            "flex-1 bg-[#141414] text-[#E4E3E0] py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg",
            isSaving ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"
          )}
        >
          <Save className={cn("w-5 h-5", isSaving && "animate-pulse")} />
          {isSaving ? 'GUARDANDO...' : 'GUARDAR REGISTRO'}
        </button>
        <button
          type="button"
          disabled={isSaving}
          onClick={onCancel}
          className="flex-1 bg-white text-[#141414] border border-[#141414]/10 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all disabled:opacity-50"
        >
          <X className="w-5 h-5" />
          CANCELAR
        </button>
      </div>

      <div className="grid grid-cols-1 gap-10">
        {/* Main Info Sections */}
        <div className="space-y-10">
          <section className="overflow-hidden rounded-xl shadow-sm border border-[#141414]/10">
            <div className="bg-[#141414] text-[#E4E3E0] p-4 flex items-center gap-3">
              <User className="w-5 h-5" />
              <h3 className="font-serif italic text-lg">I. Identificación y Ubicación</h3>
            </div>
            <div className="bg-white p-8 grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
              {user?.role === 'ADMIN' && !user?.health_unit_id && (
                <div className="md:col-span-3 p-4 bg-amber-50 rounded-xl border border-amber-200 mb-4 animate-in slide-in-from-top duration-300">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-amber-700 block mb-2">
                    {initialData ? "Transferir a Unidad de Salud (Cambio de Domicilio)" : "Asignar a Unidad de Salud"}
                  </label>
                  <select
                    required
                    name="health_unit_id"
                    value={formData.health_unit_id || ''}
                    onChange={handleChange}
                    className="w-full bg-white border border-amber-200 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                  >
                    <option value="">--- Seleccionar Unidad ---</option>
                    {units.map(u => (
                      <option key={u.id} value={u.id}>{u.nombre} ({u.clues})</option>
                    ))}
                  </select>
                </div>
              )}
              {renderInput("Folio Sistema (Auto)", "folio", "text", false, null, "Auto-generado")}
              {renderInput("Folio Intransferible", "folio_intransferible")}
              {renderInput("Nombre Completo", "nombre", "text", true)}
              {renderInput("CURP", "curp")}
              {renderInput("Teléfono", "telefono")}
              {renderInput("Domicilio", "domicilio")}
              {renderInput("Tipo de Localidad", "tipo_localidad", "text", false, [{ value: 'SEDE', label: 'SEDE' }, { value: 'LAI', label: 'LAI' }])}
              {renderInput("Derechohabiencia", "derechohabiencia", "text", false, [
                { value: '', label: 'Seleccionar...' },
                { value: 'IMSS BIENESTAR OPD', label: 'IMSS BIENESTAR OPD' },
                { value: 'IMSS BIENESTAR PROGRAMA', label: 'IMSS BIENESTAR PROGRAMA' },
                { value: 'IMSS ORDINARIO', label: 'IMSS ORDINARIO' },
                { value: 'ISSSTE', label: 'ISSSTE' },
                { value: 'ISSSTECH', label: 'ISSSTECH' },
                { value: 'SEDENA', label: 'SEDENA' },
                { value: 'OTRO', label: 'OTRO' }
              ])}
              {renderInput("Fecha de Nacimiento", "fecha_nacimiento", "date", true)}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase tracking-[0.15em] text-[#141414]/40 font-bold block">Edad</span>
                <span className={cn("text-sm font-mono font-bold block py-1 border-b-2 border-transparent", age < 18 && "text-red-600")}>{age} años</span>
              </div>

              {age > 0 && age < 18 && (
                <>
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase tracking-[0.15em] text-red-500 font-bold block">Notificar a MP</span>
                    <span className="text-sm font-mono font-bold text-red-600 block py-1 border-b-2 border-transparent">SÍ</span>
                  </div>
                  {renderInput("Reporte a MP Realizado", "reporte_mp", "text", false, [{ value: '', label: 'Seleccionar' }, { value: 'S', label: 'SÍ' }, { value: 'N', label: 'NO' }])}
                </>
              )}
            </div>
          </section>

          <section className="overflow-hidden rounded-xl shadow-sm border border-[#141414]/10">
            <div className="bg-[#141414] text-[#E4E3E0] p-4 flex items-center gap-3">
              <Calendar className="w-5 h-5" />
              <h3 className="font-serif italic text-lg">II. Antecedentes y Estado Actual</h3>
            </div>
            <div className="bg-white p-8 grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
              {renderInput("Condición", "condicion", "text", false, [
                { value: 'EMBARAZADA DE PRIMERA VEZ', label: 'EMBARAZADA DE PRIMERA VEZ' },
                { value: 'EMBARAZADA SUBSECUENTE', label: 'EMBARAZADA SUBSECUENTE' },
                { value: 'PUERPERA DE PRIMERA VEZ', label: 'PUERPERA DE PRIMERA VEZ' },
                { value: 'PUERPERA SUBSECUENTE', label: 'PUERPERA SUBSECUENTE' }
              ])}
              {renderInput("Gestas", "gestas", "number")}
              {renderInput("Cesáreas", "cesareas", "number")}
              {renderInput("Fecha Última Cesárea", "fecha_ultima_cesarea", "date")}
              {renderInput("Partos", "partos", "number")}
              {renderInput("Abortos", "abortos", "number")}
              {renderInput("Fecha Último Aborto", "fecha_ultimo_aborto", "date")}
              {renderInput("FUM", "fum", "date")}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase tracking-[0.15em] text-[#141414]/40 font-bold block">SDG (Calculado)</span>
                <span className="text-sm font-mono font-bold block py-1 border-b-2 border-transparent">{sdg}</span>
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase tracking-[0.15em] text-[#141414]/40 font-bold block">FPP (Naegele)</span>
                <span className="text-sm font-mono font-bold block py-1 border-b-2 border-transparent">{fpp || '---'}</span>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-[0.15em] text-[#141414]/40 font-bold block">
                  Riesgo Obstétrico (Coopland)
                </label>
                <select
                  name="riesgo_obstetrico"
                  value={formData.riesgo_obstetrico ?? 0}
                  onChange={handleChange}
                  className="w-full bg-transparent border-b-2 border-[#141414]/10 px-0 py-1 text-sm font-mono font-bold focus:outline-none focus:border-[#141414] transition-all appearance-none cursor-pointer"
                >
                  {Array.from({ length: 26 }, (_, i) => (
                    <option key={i} value={i}>{i} puntos</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <div className={cn(
                  "w-full py-1 border-b-2 font-bold text-xs uppercase tracking-widest transition-all",
                  riskInfo.color.split(' ').find(c => c.startsWith('text-'))?.replace('700', '600') || ''
                )}>
                  {riskInfo.label}
                </div>
              </div>
              <div className="md:col-span-3">
                {renderInput("Factores de Riesgo (>1 especificar)", "factores_riesgo")}
              </div>
              {renderInput("Riesgo Social", "riesgo_social")}
              {renderInput("Salud Mental (Fecha)", "salud_mental_fecha", "date")}
              {renderInput("Puntaje Edimburgo", "salud_mental_puntaje", "number")}
            </div>
          </section>

          <section className="overflow-hidden rounded-xl shadow-sm border border-[#141414]/10">
            <div className="bg-[#141414] text-[#E4E3E0] p-4 flex items-center gap-3">
              <Activity className="w-5 h-5" />
              <h3 className="font-serif italic text-lg">III. Seguimiento Clínico</h3>
            </div>
            <div className="bg-white p-8 grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
              {renderInput("TAS", "tas", "number")}
              {renderInput("TAD", "tad", "number")}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase tracking-[0.15em] text-[#141414]/40 font-bold block">TAM (Calculado)</span>
                <span className="text-sm font-mono font-bold block py-1 border-b-2 border-transparent">{tam} mmHg</span>
              </div>

              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6 pt-6 border-t border-[#141414]/5">
                <div className="md:col-span-3">
                  <p className="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em] mb-4">Medicina Preventiva (Biológicos)</p>
                </div>

                {formData.condicion?.startsWith('EMBARAZADA') && (
                  <div className="md:col-span-3 mb-4">
                    {getVaccineAlerts(formData.fum || '', formData.td_fecha_1ra || '', formData.td_fecha_2da || '', formData.tdpa_fecha || '', formData.influenza_fecha || '').length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {getVaccineAlerts(formData.fum || '', formData.td_fecha_1ra || '', formData.td_fecha_2da || '', formData.tdpa_fecha || '', formData.influenza_fecha || '').map((alert, i) => (
                          <div key={i} className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-2 animate-in fade-in slide-in-from-left-2 transition-all">
                            <AlertCircle className="w-3 h-3" />
                            {alert}
                          </div>
                        ))}
                      </div>
                    ) : formData.fum ? (
                      <div className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest flex items-center gap-2">
                        <Save className="w-3 h-3" />
                        Todo al corriente con biológicos
                      </div>
                    ) : null}
                  </div>
                )}
                {renderInput("Td 1ra Dosis (F)", "td_fecha_1ra", "date")}
                {renderInput("Td 2da Dosis (F)", "td_fecha_2da", "date")}
                {renderInput("Td 3ra Dosis (F)", "td_fecha_3ra", "date")}
                {renderInput("Tdpa (F)", "tdpa_fecha", "date")}
                {renderInput("Influenza (F)", "influenza_fecha", "date")}
                <div className="hidden md:block"></div>
              </div>

              <div className="md:col-span-3 pt-6 border-t border-[#141414]/5 grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
                <div className="md:col-span-3">
                  <p className="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em] mb-4">Laboratorios y Suplementación</p>
                </div>
                {renderInput("Tamiz DM (Glucosa)", "tamiz_dm")}
                {renderInput("BH (Hb)", "bh_hb")}
              </div>
              {renderInput("Tipo de Sangre", "tipo_sangre", "text", false, [
                { value: '', label: 'Seleccionar' },
                { value: 'A', label: 'A' },
                { value: 'B', label: 'B' },
                { value: 'AB', label: 'AB' },
                { value: 'O', label: 'O' }
              ])}
              {renderInput("Factor Rh", "rh", "text", false, [
                { value: '', label: 'Seleccionar' },
                { value: 'Positivo', label: 'Positivo' },
                { value: 'Negativo', label: 'Negativo' }
              ])}
              {renderInput("VIH Resultado", "vih_resultado", "text", false, [{ value: '', label: 'Seleccionar' }, { value: 'Reactivo', label: 'Reactivo' }, { value: 'No Reactivo', label: 'No Reactivo' }])}
              {renderInput("VIH Fecha", "vih_fecha", "date")}
              {renderInput("Sífilis Resultado", "sifilis_resultado", "text", false, [{ value: '', label: 'Seleccionar' }, { value: 'Reactivo', label: 'Reactivo' }, { value: 'No Reactivo', label: 'No Reactivo' }])}
              {renderInput("Sífilis Fecha", "sifilis_fecha", "date")}
              {renderInput("EGO Resultado", "ego_resultado", "text", false, [{ value: '', label: 'Seleccionar' }, { value: 'Normal', label: 'Normal' }, { value: 'Proteinuria', label: 'Proteinuria' }, { value: 'IVU', label: 'IVU' }])}
              {renderInput("EGO Fecha", "ego_fecha", "date")}
              {renderInput("Ácido Fólico", "acido_folico", "text", false, [{ value: 'S', label: 'SÍ' }, { value: 'N', label: 'NO' }])}
              {renderInput("Fumarato Ferroso", "fumarato_ferroso", "text", false, [{ value: 'S', label: 'SÍ' }, { value: 'N', label: 'NO' }])}
              {renderInput("AAS (Preeclampsia)", "aas", "text", false, [{ value: 'S', label: 'SÍ' }, { value: 'N', label: 'NO' }])}
              {renderInput("Calcio", "calcio", "text", false, [{ value: 'S', label: 'SÍ' }, { value: 'N', label: 'NO' }])}
              <div className="md:col-span-3">
                {renderInput("Estado de Salud Actual", "estado_salud_actual")}
              </div>
              <div className="md:col-span-1">
                {renderInput("Fecha de USG más reciente", "fecha_usg_reciente", "date")}
              </div>
              <div className="md:col-span-2">
                {renderInput("Conclusiones del Ultrasonido", "conclusiones_usg")}
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl shadow-sm border border-[#141414]/10">
            <div className="bg-[#141414] text-[#E4E3E0] p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5" />
              <h3 className="font-serif italic text-lg">IV. Referencias y Planes</h3>
            </div>
            <div className="bg-white p-8 grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
              {renderInput("Plan de Seguridad", "plan_seguridad", "text", false, [{ value: 'S', label: 'SÍ' }, { value: 'N', label: 'NO' }])}
              {renderInput("Fecha Plan Seg.", "plan_seguridad_fecha", "date")}
              <div className="md:col-span-1">
                {renderInput("Plan de Manejo", "plan_manejo")}
              </div>

              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6 pt-6 border-t border-[#141414]/5">
                <div className="md:col-span-3">
                  <p className="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em] mb-4">Módulo Mater</p>
                </div>
                {renderInput("Hospital", "ref_mater_hospital")}
                {renderInput("¿Acudió?", "ref_mater_acudio", "text", false, [{ value: '', label: '---' }, { value: 'S', label: 'SÍ' }, { value: 'N', label: 'NO' }])}
                {renderInput("Resultado Mater", "ref_mater_resultado")}
              </div>

              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6 pt-6 border-t border-[#141414]/5">
                <div className="md:col-span-3">
                  <p className="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em] mb-4">Atención a Urgencias</p>
                </div>
                {renderInput("Hospital Urgencias", "ref_urgencias_hospital")}
                {renderInput("¿Acudió?", "ref_urgencias_acudio", "text", false, [{ value: '', label: '---' }, { value: 'S', label: 'SÍ' }, { value: 'N', label: 'NO' }])}
                {renderInput("Resultado Urgencias", "ref_urgencias_resultado")}
              </div>

              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6 pt-6 border-t border-[#141414]/5">
                <div className="md:col-span-3">
                  <p className="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em] mb-4">Plataforma Comunitaria y Partería</p>
                </div>
                {renderInput("¿Derivada por Plataforma Com.?", "derivacion_plataforma_comunitaria", "text", false, [{ value: 'S', label: 'SÍ' }, { value: 'N', label: 'NO' }])}
                {renderInput("¿Control por Partería Trad.?", "control_parteria_tradicional", "text", false, [{ value: 'S', label: 'SÍ' }, { value: 'N', label: 'NO' }])}
                {formData.control_parteria_tradicional === 'S' && renderInput("Nombre de la Partera", "nombre_partera")}
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl shadow-sm border border-[#141414]/10">
            <div className="bg-[#141414] text-[#E4E3E0] p-4 flex items-center gap-3">
              <Activity className="w-5 h-5" />
              <h3 className="font-serif italic text-lg">V. Evento Obstétrico y Recién Nacido</h3>
            </div>
            <div className="bg-white p-8 grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
              {renderInput("Conclusión", "conclusion_embarazo", "text", false, [{ value: '', label: '---' }, { value: 'Parto', label: 'Parto' }, { value: 'Cesárea', label: 'Cesárea' }, { value: 'Aborto', label: 'Aborto' }])}
              {renderInput("SDG Nacimiento", "sdg_nacimiento", "number")}
              {renderInput("Fecha Evento", "fecha_atencion_evento", "date")}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase tracking-[0.15em] text-[#141414]/40 font-bold block">Días Puerperio</span>
                <span className="text-sm font-mono font-bold block py-1 border-b-2 border-transparent">{puerperioDays} días</span>
              </div>
              {renderInput("Lugar Atención", "lugar_atencion_evento")}
              {renderInput("Estado Salud Materna", "estado_salud_materna_puerperio")}

              {renderInput("RN Estado", "rn_estado", "text", false, [{ value: '', label: '---' }, { value: 'Vivo', label: 'Vivo' }, { value: 'Muerto', label: 'Muerto' }])}
              {renderInput("RN Género", "rn_genero", "text", false, [{ value: '', label: '---' }, { value: 'Masculino', label: 'Masculino' }, { value: 'Femenino', label: 'Femenino' }])}
              {renderInput("RN Salud", "rn_salud", "text", false, [{ value: '', label: '---' }, { value: 'Sano', label: 'Sano' }, { value: 'Enfermo', label: 'Enfermo' }])}

              {renderInput("Tamiz Metabólico (F)", "tamiz_metabolico_fecha", "date")}
              {renderInput("¿Sospechoso?", "tamiz_metabolico_sospechoso", "text", false, [{ value: '', label: '---' }, { value: 'S', label: 'SÍ' }, { value: 'N', label: 'NO' }])}
              <div className="hidden md:block"></div>

              {renderInput("Tamiz Auditivo (F)", "tamiz_auditivo_fecha", "date")}
              {renderInput("¿Sospechoso?", "tamiz_auditivo_sospechoso", "text", false, [{ value: '', label: '---' }, { value: 'S', label: 'SÍ' }, { value: 'N', label: 'NO' }])}
              <div className="hidden md:block"></div>

              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6 pt-6 border-t border-[#141414]/5">
                <div className="md:col-span-3">
                  <p className="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em] mb-4">Planificación Familiar (MPF)</p>
                </div>
                {renderInput("MPF de elección", "mpf_eleccion")}
                {renderInput("MPF Aplicado", "mpf_aplicado")}
                {renderInput("Motivo de rechazo", "motivo_rechazo_mpf")}
                {renderInput("Club de Embarazadas", "club_embarazadas", "text", false, [{ value: 'S', label: 'SÍ' }, { value: 'N', label: 'NO' }])}
                <div className="md:col-span-2">
                  {renderInput("Diagnóstico Específico", "diagnostico_especifico", "text", false, [
                    { value: '', label: 'Seleccionar...' },
                    { value: 'Puerperio post aborto/ SMPF', label: 'Puerperio post aborto/ SMPF' },
                    { value: 'Puerperio post aborto/ OTB', label: 'Puerperio post aborto/ OTB' },
                    { value: 'Puerperio post aborto/ Otro metodo', label: 'Puerperio post aborto/ Otro metodo' },
                    { value: 'Puerperio post aborto/ DIU', label: 'Puerperio post aborto/ DIU' },
                    { value: 'Puerperio post cesarea/ SMPF', label: 'Puerperio post cesarea/ SMPF' },
                    { value: 'Puerperio post cesarea/ OTB', label: 'Puerperio post cesarea/ OTB' },
                    { value: 'Puerperio post cesarea/ Otro metodo', label: 'Puerperio post cesarea/ Otro metodo' },
                    { value: 'Puerperio post cesarea/ DIU', label: 'Puerperio post cesarea/ DIU' },
                    { value: 'Puerperio post parto/ SMPF', label: 'Puerperio post parto/ SMPF' },
                    { value: 'Puerperio post parto/ OTB', label: 'Puerperio post parto/ OTB' },
                    { value: 'Puerperio post parto/ Otro metodo', label: 'Puerperio post parto/ Otro metodo' },
                    { value: 'Puerperio post parto/ DIU', label: 'Puerperio post parto/ DIU' }
                  ])}
                </div>
                <div className="md:col-span-3">
                  {renderInput("Plan de Manejo en el Puerperio", "plan_manejo_puerperio")}
                </div>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl shadow-sm border border-[#141414]/10">
            <div className="bg-[#141414] text-[#E4E3E0] p-4 flex items-center gap-3">
              <Stethoscope className="w-5 h-5" />
              <h3 className="font-serif italic text-lg">VI. Seguimiento Social y Cierre</h3>
            </div>
            <div className="bg-white p-8 grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
              <div className="md:col-span-3 p-4 bg-[#141414]/5 rounded-lg border border-[#141414]/10 mb-4">
                <label className="text-[10px] uppercase tracking-widest opacity-50 font-bold block mb-2">
                  Seleccionar Núcleo de Salud
                </label>
                <select
                  value={formData.nucleo_nombre ?? ''}
                  onChange={handleNucleoChange}
                  className="w-full bg-white border border-[#141414]/10 rounded px-3 py-2 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-[#141414] transition-all"
                >
                  <option value="">--- Seleccionar Núcleo ---</option>
                  {nucleos.map(n => (
                    <option key={n.id} value={n.nombre}>{n.nombre}</option>
                  ))}
                </select>
              </div>

              {renderInput("Médico que Atiende", "medico_atencion", "text", true)}
              {renderInput("Última Consulta", "fecha_ultima_consulta", "date")}
              {renderInput("Próxima Cita", "fecha_proxima_cita", "date")}

              {renderInput("Médico Responsable", "medico_nombre", "text", true)}
              {renderInput("Cédula Profesional", "medico_cedula", "text", true)}
              <div className="hidden md:block"></div>

              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6 pt-6 border-t border-[#141414]/5">
                <div className="md:col-span-3">
                  <p className="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em] mb-4">Trabajo Social</p>
                </div>
                {renderInput("Seguimiento TS", "seguimiento_ts")}
                {renderInput("Fecha Act. TS", "fecha_actualizacion_ts", "date")}
              </div>
              <div className="md:col-span-3 pt-4 border-t border-[#141414]/5">
                {renderInput("Observaciones generales", "observaciones_generales", "textarea")}
              </div>
            </div>
          </section>
        </div>
      </div>
    </form>
  );
}
