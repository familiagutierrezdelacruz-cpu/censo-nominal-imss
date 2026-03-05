import React from 'react';
import { CensusRecord } from '../types/census';
import { cn } from '../utils/cn';
import {
  calculateAge,
  calculateSDG,
  calculateFPP,
  calculateTAM,
  calculatePuerperioDays,
  calculateDaysSinceUpdate,
  formatDate
} from '../utils/calculations';
import {
  User,
  Calendar,
  Activity,
  MapPin,
  FileText,
  AlertTriangle,
  Heart,
  Stethoscope,
  Baby,
  ShieldCheck,
  ArrowLeft,
  Printer,
  Clock
} from 'lucide-react';

interface CensusDetailProps {
  record: CensusRecord;
  onBack: () => void;
  onEdit: () => void;
}

export default function CensusDetail({ record, onBack, onEdit }: CensusDetailProps) {
  const age = calculateAge(record.fecha_nacimiento);
  const sdg = calculateSDG(record.fum);
  const fpp = calculateFPP(record.fum);
  const tam = calculateTAM(record.tas, record.tad);
  const puerperioDays = calculatePuerperioDays(record.fecha_atencion_evento);
  const daysSinceUpdate = calculateDaysSinceUpdate(record.fecha_ultima_consulta);

  const getRiskLevel = (score: number) => {
    if (score <= 3) return { label: 'Bajo Riesgo', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    if (score <= 6) return { label: 'Riesgo Moderado', color: 'bg-amber-100 text-amber-700 border-amber-200' };
    return { label: 'Alto Riesgo', color: 'bg-red-100 text-red-700 border-red-200' };
  };

  const riskInfo = getRiskLevel(record.riesgo_obstetrico || 0);

  const Section = ({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) => (
    <div className="bg-white border border-[#141414]/10 rounded-xl overflow-hidden mb-10 shadow-sm">
      <div className="bg-[#141414] text-[#E4E3E0] px-6 py-4 flex items-center gap-3">
        <Icon className="w-5 h-5" />
        <h3 className="font-serif italic text-lg">{title}</h3>
      </div>
      <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
        {children}
      </div>
    </div>
  );

  const DataItem = ({ label, value, highlight = false, alert = false }: { label: string, value: any, highlight?: boolean, alert?: boolean }) => (
    <div className="space-y-1.5">
      <p className={cn("text-[10px] uppercase tracking-[0.15em] font-bold", alert ? "text-red-500" : "text-[#141414]/40")}>
        {label}
      </p>
      <p className={cn("font-mono text-sm font-bold", alert && "text-red-600", highlight && "text-base")}>
        {value || '---'}
      </p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-bold hover:opacity-70 transition-all cursor-pointer mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            VOLVER AL LISTADO
          </button>
          <div className="flex flex-wrap items-center gap-4">
            <h2 className="text-3xl font-bold tracking-tight text-[#141414] uppercase">{record.nombre}</h2>
            <div className="flex items-center gap-2">
              <div className={cn(
                "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm",
                riskInfo.color
              )}>
                {riskInfo.label}
              </div>
              {record.condicion.startsWith('EMBARAZADA') && (
                <div className="px-3 py-1 bg-blue-100 text-blue-700 border border-blue-200 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                  <Baby className="w-3.5 h-3.5" />
                  {sdg}
                </div>
              )}
              <div className={cn(
                "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm flex items-center gap-1.5",
                daysSinceUpdate > 30 ? "bg-red-50 text-red-600 border-red-100" : "bg-gray-100 text-gray-600 border-gray-200"
              )}>
                <Clock className="w-3.5 h-3.5" />
                {daysSinceUpdate} DÍAS SIN CITA
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onEdit}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              EDITAR REGISTRO
            </button>
            <button
              type="button"
              onClick={() => {
                const btn = document.activeElement as HTMLButtonElement;
                const originalText = btn.innerHTML;
                btn.innerText = "PREPARANDO...";
                btn.disabled = true;

                setTimeout(() => {
                  try {
                    window.print();
                  } catch (e) {
                    console.error('Print error:', e);
                  } finally {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                  }
                }, 300);
              }}
              className="flex items-center gap-2 bg-[#141414] text-[#E4E3E0] px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              IMPRIMIR REPORTE
            </button>
          </div>
          <p className="text-[10px] text-[#141414]/40 font-mono uppercase tracking-wider print:hidden">
            Atajo: Ctrl + P (Windows) / Cmd + P (Mac)
          </p>
        </div>
      </div>

      <div className="space-y-6 print:space-y-4">
        {/* I. IDENTIFICACIÓN */}
        <Section title="I. Identificación y Ubicación" icon={User}>
          <DataItem label="Folio Sistema" value={record.folio} highlight />
          <DataItem label="Folio Intransferible" value={record.folio_intransferible} highlight />
          <DataItem label="Nombre Completo" value={record.nombre} highlight />
          <DataItem label="CURP" value={record.curp} />
          <DataItem label="Teléfono" value={record.telefono} />
          <DataItem label="Domicilio" value={record.domicilio} />
          <DataItem label="Tipo de Localidad" value={record.tipo_localidad} />
          <DataItem label="Fecha de Nacimiento" value={formatDate(record.fecha_nacimiento)} />
          <DataItem label="Edad" value={`${age} años`} />
          {age < 15 && (
            <>
              <DataItem label="Notificar a MP" value="SÍ" alert />
              <DataItem label="Reporte a MP Realizado" value={record.reporte_mp === 'S' ? 'SÍ' : 'NO'} alert={record.reporte_mp === 'N'} />
            </>
          )}
        </Section>

        {/* II. ANTECEDENTES */}
        <Section title="II. Antecedentes y Estado Actual" icon={Calendar}>
          <DataItem label="Condición" value={record.condicion} highlight />
          <DataItem label="Gestas" value={record.gestas} />
          <DataItem label="Cesáreas" value={record.cesareas} />
          <DataItem label="Fecha Última Cesárea" value={formatDate(record.fecha_ultima_cesarea)} />
          <DataItem label="Partos" value={record.partos} />
          <DataItem label="Abortos" value={record.abortos} />
          <DataItem label="Fecha Último Aborto" value={formatDate(record.fecha_ultimo_aborto)} />
          <DataItem label="FUM" value={formatDate(record.fum)} />
          {record.condicion.startsWith('EMBARAZADA') && (
            <>
              <DataItem label="SDG" value={sdg} highlight />
              <DataItem label="FPP" value={formatDate(fpp)} highlight />
            </>
          )}
          <div className="md:col-span-3 p-4 rounded-lg border border-[#141414]/5 bg-[#141414]/5 flex items-center justify-between mt-2 transition-all">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-[0.15em] text-[#141414]/40 font-bold">Riesgo Obstétrico (Coopland)</span>
              <span className="font-mono font-bold text-lg">{record.riesgo_obstetrico} puntos</span>
            </div>
            <div className={cn(
              "px-6 py-2 rounded-full font-bold text-[10px] uppercase tracking-widest border shadow-sm",
              riskInfo.color
            )}>
              {riskInfo.label}
            </div>
          </div>
          <DataItem label="Factores de Riesgo" value={record.factores_riesgo} />
          <DataItem label="Riesgo Social" value={record.riesgo_social} />
          <DataItem label="Salud Mental (Edimburgo)" value={`${formatDate(record.salud_mental_fecha)} | Puntaje: ${record.salud_mental_puntaje}`} />
        </Section>

        {/* III. SEGUIMIENTO CLÍNICO */}
        <Section title="III. Seguimiento Clínico y Laboratorio" icon={Activity}>
          <DataItem label="TA (TAS/TAD)" value={`${record.tas}/${record.tad}`} />
          <DataItem label="TAM" value={tam} highlight />
          <DataItem label="Tamiz DM (Glucosa)" value={record.tamiz_dm} />
          <DataItem label="BH (Hb)" value={record.bh_hb} />
          <DataItem label="Tipo de Sangre" value={`${record.tipo_sangre ?? '---'}${(record.rh === 'Positivo' ? '+' : record.rh === 'Negativo' ? '-' : '')}`} />
          <DataItem label="VIH" value={`${record.vih_resultado} (${formatDate(record.vih_fecha)})`} />
          <DataItem label="Sífilis" value={`${record.sifilis_resultado} (${formatDate(record.sifilis_fecha)})`} />
          <DataItem label="EGO/Urotest" value={`${record.ego_resultado} (${formatDate(record.ego_fecha)})`} />
          <DataItem label="Micronutrimentos" value={`Ác. Fólico: ${record.acido_folico} | Hierro: ${record.fumarato_ferroso}`} />
          <DataItem label="Prevención Preeclampsia" value={`AAS: ${record.aas} | Calcio: ${record.calcio}`} />
          <DataItem label="Estado de Salud Actual" value={record.estado_salud_actual} />
        </Section>

        {/* IV. REFERENCIAS */}
        <Section title="IV. Referencias y Contrareferencias" icon={ShieldCheck}>
          <DataItem label="Plan de Seguridad" value={`${record.plan_seguridad} (${formatDate(record.plan_seguridad_fecha)})`} />
          <DataItem label="Plan de Manejo" value={record.plan_manejo} />
          <DataItem label="Ref. Módulo Mater" value={`${record.ref_mater_hospital} | Acudió: ${record.ref_mater_acudio === 'S' ? 'SÍ' : record.ref_mater_acudio === 'N' ? 'NO' : '---'}`} />
          <DataItem label="Resultado II Nivel (Mater)" value={record.ref_mater_resultado} />
          <DataItem label="Ref. Urgencias" value={`${record.ref_urgencias_hospital} | Acudió: ${record.ref_urgencias_acudio === 'S' ? 'SÍ' : record.ref_urgencias_acudio === 'N' ? 'NO' : '---'}`} />
          <DataItem label="Resultado II Nivel (Urgencias)" value={record.ref_urgencias_resultado} />
        </Section>

        {/* V. EVENTO OBSTÉTRICO */}
        <Section title="V. Evento Obstétrico y Recién Nacido" icon={Baby}>
          <DataItem label="Conclusion Embarazo" value={record.conclusion_embarazo} />
          <DataItem label="SDG al Nacimiento" value={record.sdg_nacimiento} />
          <DataItem label="Fecha y Lugar" value={`${formatDate(record.fecha_atencion_evento)} | ${record.lugar_atencion_evento}`} />
          {record.condicion.startsWith('PUERPERA') && (
            <DataItem label="Días de Puerperio" value={`${puerperioDays} días`} highlight />
          )}
          <DataItem label="Estado Materno" value={record.estado_salud_materna_puerperio} />
          <DataItem label="RN Estado" value={record.rn_estado} />
          <DataItem label="RN Género" value={record.rn_genero} />
          <DataItem label="RN Salud" value={record.rn_salud} />
          <DataItem label="Tamiz Metabólico" value={`${formatDate(record.tamiz_metabolico_fecha)} | Sospechoso: ${record.tamiz_metabolico_sospechoso === 'S' ? 'SÍ' : record.tamiz_metabolico_sospechoso === 'N' ? 'NO' : '---'}`} alert={record.tamiz_metabolico_sospechoso === 'S'} />
          <DataItem label="Tamiz Auditivo" value={`${formatDate(record.tamiz_auditivo_fecha)} | Sospechoso: ${record.tamiz_auditivo_sospechoso === 'S' ? 'SÍ' : record.tamiz_auditivo_sospechoso === 'N' ? 'NO' : '---'}`} alert={record.tamiz_auditivo_sospechoso === 'S'} />
          <DataItem label="MPF Elección" value={record.mpf_eleccion} />
          <DataItem label="MPF Aplicado" value={record.mpf_aplicado} />
          <DataItem label="Motivo Rechazo" value={record.motivo_rechazo_mpf} />
          <DataItem label="Diagnóstico Específico" value={record.diagnostico_especifico} highlight />
        </Section>

        {/* VI. CIERRE */}
        <Section title="VI. Cierre y Seguimiento Social" icon={FileText}>
          <DataItem label="Club de Embarazadas" value={record.club_embarazadas} />
          <DataItem label="Seguimiento TS" value={record.seguimiento_ts} />
          <DataItem label="Fecha Act. TS" value={formatDate(record.fecha_actualizacion_ts)} />
          <DataItem label="Última Consulta" value={formatDate(record.fecha_ultima_consulta)} />
          <DataItem label="Próxima Cita" value={formatDate(record.fecha_proxima_cita)} />
          <DataItem label="Días sin Actualizar" value={`${daysSinceUpdate} días`} alert={daysSinceUpdate > 30} />
        </Section>

        {/* VII. DATOS DEL MÉDICO */}
        <Section title="VII. Datos del Médico y Atención" icon={User}>
          <DataItem label="Núcleo de Salud" value={record.nucleo_nombre} highlight />
          <DataItem label="Médico Responsable" value={record.medico_nombre} />
          <DataItem label="Cédula Profesional" value={record.medico_cedula} />
          <DataItem label="Médico que Atendió" value={record.medico_atencion} highlight />
        </Section>
      </div>
    </div>
  );
}
