import React from 'react';
import { CensusRecord, User as UserType } from '../types/census';
import { ArrowLeft, Download, Table as TableIcon } from 'lucide-react';
import * as XLSX from 'xlsx';
import { formatDate } from '../utils/calculations';

interface CensusReportProps {
  records: CensusRecord[];
  user: UserType | null;
  onBack: () => void;
}

export default function CensusReport({ records, user, onBack }: CensusReportProps) {
  const exportToExcel = () => {
    // Prepare data for Excel
    const dataToExport = records.map(record => ({
      'Folio Sistema': record.folio,
      'Folio Intransferible': record.folio_intransferible,
      'Nombre': record.nombre,
      'CURP': record.curp,
      'Teléfono': record.telefono,
      'Domicilio': record.domicilio,
      'Localidad': record.tipo_localidad,
      'Fecha Nacimiento': formatDate(record.fecha_nacimiento),
      'Reporte MP': record.reporte_mp,
      'Condición': record.condicion,
      'Gestas': record.gestas,
      'Cesáreas': record.cesareas,
      'F. Última Cesárea': formatDate(record.fecha_ultima_cesarea),
      'Partos': record.partos,
      'Abortos': record.abortos,
      'F. Último Aborto': formatDate(record.fecha_ultimo_aborto),
      'FUM': formatDate(record.fum),
      'Riesgo Obstétrico (Puntos)': record.riesgo_obstetrico,
      'Factores de Riesgo': record.factores_riesgo,
      'Riesgo Social': record.riesgo_social,
      'Salud Mental Fecha': formatDate(record.salud_mental_fecha),
      'Salud Mental Puntaje': record.salud_mental_puntaje,
      'TAS': record.tas,
      'TAD': record.tad,
      'Tamiz DM': record.tamiz_dm,
      'BH Hb': record.bh_hb,
      'Tipo de Sangre': record.tipo_sangre,
      'Factor Rh': record.rh,
      'VIH Resultado': record.vih_resultado,
      'VIH Fecha': formatDate(record.vih_fecha),
      'Sífilis Resultado': record.sifilis_resultado,
      'Sífilis Fecha': formatDate(record.sifilis_fecha),
      'EGO Resultado': record.ego_resultado,
      'EGO Fecha': formatDate(record.ego_fecha),
      'Ácido Fólico': record.acido_folico,
      'Fumarato Ferroso': record.fumarato_ferroso,
      'AAS': record.aas,
      'Calcio': record.calcio,
      'Estado Salud Actual': record.estado_salud_actual,
      'Plan Seguridad': record.plan_seguridad,
      'Plan Seguridad Fecha': formatDate(record.plan_seguridad_fecha),
      'Plan Manejo': record.plan_manejo,
      'Ref. Mater Hospital': record.ref_mater_hospital,
      'Ref. Mater Acudió': record.ref_mater_acudio,
      'Ref. Mater Resultado': record.ref_mater_resultado,
      'Ref. Urgencias Hospital': record.ref_urgencias_hospital,
      'Ref. Urgencias Acudió': record.ref_urgencias_acudio,
      'Ref. Urgencias Resultado': record.ref_urgencias_resultado,
      'Referencia Plataforma Com.': record.derivacion_plataforma_comunitaria,
      'Control Partería Trad.': record.control_parteria_tradicional,
      'Nombre de la Partera': record.nombre_partera,
      'Conclusión Embarazo': record.conclusion_embarazo,
      'SDG Nacimiento': record.sdg_nacimiento,
      'F. Atención Evento': formatDate(record.fecha_atencion_evento),
      'Lugar Atención': record.lugar_atencion_evento,
      'Estado Salud Materna Puerperio': record.estado_salud_materna_puerperio,
      'RN Estado': record.rn_estado,
      'RN Género': record.rn_genero,
      'RN Salud': record.rn_salud,
      'Tamiz Metabólico Fecha': formatDate(record.tamiz_metabolico_fecha),
      'Tamiz Metabólico Sospechoso': record.tamiz_metabolico_sospechoso,
      'Tamiz Auditivo Fecha': formatDate(record.tamiz_auditivo_fecha),
      'Tamiz Auditivo Sospechoso': record.tamiz_auditivo_sospechoso,
      'MPF Elección': record.mpf_eleccion,
      'MPF Aplicado': record.mpf_aplicado,
      'Motivo Rechazo MPF': record.motivo_rechazo_mpf,
      'Diagnóstico Específico': record.diagnostico_especifico,
      'Club Embarazadas': record.club_embarazadas,
      'Seguimiento TS': record.seguimiento_ts,
      'Fecha Actualización TS': formatDate(record.fecha_actualizacion_ts),
      'F. Última Consulta': formatDate(record.fecha_ultima_consulta),
      'F. Próxima Cita': formatDate(record.fecha_proxima_cita),
      'Médico que Atiende': record.medico_atencion,
      'Médico Responsable': record.medico_nombre,
      'Cédula Médico': record.medico_cedula,
      'Núcleo': record.nucleo_nombre,
      'Fecha Registro': formatDate(record.created_at || ''),
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Censo Nominal");

    // Generate filename with current date
    const date = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Censo_Nominal_Sabana_${date}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-[#141414]/5 rounded-full transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-serif italic flex items-center gap-2">
              <TableIcon className="w-6 h-6" />
              Reporte Sábana
            </h2>
            <p className="text-xs opacity-50 uppercase tracking-widest font-bold">
              Vista completa: {user?.health_unit_name || 'Todas las Unidades'} ({records.length} registros)
            </p>
          </div>
        </div>
        <button
          onClick={exportToExcel}
          className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700 transition-all shadow-sm active:scale-95"
        >
          <Download className="w-4 h-4" />
          EXPORTAR A EXCEL
        </button>
      </div>

      <div className="bg-white border border-[#141414]/10 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[8000px]">
            <thead>
              <tr className="bg-[#141414] text-[#E4E3E0] text-[10px] uppercase tracking-widest font-bold">
                <th className="p-4 border-r border-white/10 sticky left-0 bg-[#141414] z-10">Folio</th>
                <th className="p-4 border-r border-white/10 sticky left-[100px] bg-[#141414] z-10">Folio Int.</th>
                <th className="p-4 border-r border-white/10 sticky left-[200px] bg-[#141414] z-10">Nombre</th>
                <th className="p-4 border-r border-white/10">CURP</th>
                <th className="p-4 border-r border-white/10">Teléfono</th>
                <th className="p-4 border-r border-white/10">Domicilio</th>
                <th className="p-4 border-r border-white/10">Localidad</th>
                <th className="p-4 border-r border-white/10">F. Nacimiento</th>
                <th className="p-4 border-r border-white/10">Reporte MP</th>
                <th className="p-4 border-r border-white/10">Condición</th>
                <th className="p-4 border-r border-white/10">Gestas</th>
                <th className="p-4 border-r border-white/10">Cesáreas</th>
                <th className="p-4 border-r border-white/10">F. Últ. Cesárea</th>
                <th className="p-4 border-r border-white/10">Partos</th>
                <th className="p-4 border-r border-white/10">Abortos</th>
                <th className="p-4 border-r border-white/10">F. Últ. Aborto</th>
                <th className="p-4 border-r border-white/10">FUM</th>
                <th className="p-4 border-r border-white/10">Riesgo Obs.</th>
                <th className="p-4 border-r border-white/10">Factores Riesgo</th>
                <th className="p-4 border-r border-white/10">Riesgo Social</th>
                <th className="p-4 border-r border-white/10">Salud Mental F.</th>
                <th className="p-4 border-r border-white/10">Salud Mental P.</th>
                <th className="p-4 border-r border-white/10">TAS</th>
                <th className="p-4 border-r border-white/10">TAD</th>
                <th className="p-4 border-r border-white/10">Tamiz DM</th>
                <th className="p-4 border-r border-white/10">BH Hb</th>
                <th className="p-4 border-r border-white/10">Tipo Sangre</th>
                <th className="p-4 border-r border-white/10">Rh</th>
                <th className="p-4 border-r border-white/10">VIH</th>
                <th className="p-4 border-r border-white/10">VIH Fecha</th>
                <th className="p-4 border-r border-white/10">Sífilis</th>
                <th className="p-4 border-r border-white/10">Sífilis Fecha</th>
                <th className="p-4 border-r border-white/10">EGO</th>
                <th className="p-4 border-r border-white/10">EGO Fecha</th>
                <th className="p-4 border-r border-white/10">Ácido Fólico</th>
                <th className="p-4 border-r border-white/10">Fumarato</th>
                <th className="p-4 border-r border-white/10">AAS</th>
                <th className="p-4 border-r border-white/10">Calcio</th>
                <th className="p-4 border-r border-white/10">Estado Salud</th>
                <th className="p-4 border-r border-white/10">Plan Seg.</th>
                <th className="p-4 border-r border-white/10">Plan Seg. F.</th>
                <th className="p-4 border-r border-white/10">Plan Manejo</th>
                <th className="p-4 border-r border-white/10">Ref. Mater Hosp.</th>
                <th className="p-4 border-r border-white/10">Ref. Mater Acudió</th>
                <th className="p-4 border-r border-white/10">Ref. Mater Res.</th>
                <th className="p-4 border-r border-white/10">Ref. Urgencias Hosp.</th>
                <th className="p-4 border-r border-white/10">Ref. Urgencias Acudió</th>
                <th className="p-4 border-r border-white/10">Ref. Urgencias Res.</th>
                <th className="p-4 border-r border-white/10">Ref. Plat. Com.</th>
                <th className="p-4 border-r border-white/10">Cont. Partería</th>
                <th className="p-4 border-r border-white/10">Nombre Partera</th>
                <th className="p-4 border-r border-white/10">Conclusión</th>
                <th className="p-4 border-r border-white/10">SDG Nac.</th>
                <th className="p-4 border-r border-white/10">F. Evento</th>
                <th className="p-4 border-r border-white/10">Lugar Atención</th>
                <th className="p-4 border-r border-white/10">Salud Puerperio</th>
                <th className="p-4 border-r border-white/10">RN Estado</th>
                <th className="p-4 border-r border-white/10">RN Género</th>
                <th className="p-4 border-r border-white/10">RN Salud</th>
                <th className="p-4 border-r border-white/10">Tamiz Met. F.</th>
                <th className="p-4 border-r border-white/10">Tamiz Met. S.</th>
                <th className="p-4 border-r border-white/10">Tamiz Aud. F.</th>
                <th className="p-4 border-r border-white/10">Tamiz Aud. S.</th>
                <th className="p-4 border-r border-white/10">MPF Elección</th>
                <th className="p-4 border-r border-white/10">MPF Aplicado</th>
                <th className="p-4 border-r border-white/10">Motivo Rechazo</th>
                <th className="p-4 border-r border-white/10">Diag. Específico</th>
                <th className="p-4 border-r border-white/10">Club Emb.</th>
                <th className="p-4 border-r border-white/10">Seguimiento TS</th>
                <th className="p-4 border-r border-white/10">F. Act. TS</th>
                <th className="p-4 border-r border-white/10">F. Últ. Consulta</th>
                <th className="p-4 border-r border-white/10">F. Próx. Cita</th>
                <th className="p-4 border-r border-white/10">Médico Atiende</th>
                <th className="p-4 border-r border-white/10">Médico Resp.</th>
                <th className="p-4 border-r border-white/10 text-right">Cédula Médico</th>
                <th className="p-4 border-r border-white/10">Núcleo</th>
                <th className="p-4">F. Registro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#141414]/5">
              {records.map((record, index) => {
                const prevRecord = index > 0 ? records[index - 1] : null;
                const showNucleoHeader = !prevRecord || prevRecord.nucleo_nombre !== record.nucleo_nombre;

                return (
                  <React.Fragment key={record.id}>
                    {showNucleoHeader && (
                      <tr className="bg-[#E4E3E0] font-bold text-[10px] uppercase tracking-widest">
                        <td colSpan={100} className="p-2 sticky left-0 bg-[#E4E3E0] z-10">
                          Núcleo: {record.nucleo_nombre || 'Sin Asignar'}
                        </td>
                      </tr>
                    )}
                    <tr className="hover:bg-[#E4E3E0]/30 transition-all text-xs font-mono group">
                      <td className="p-4 border-r border-[#141414]/5 sticky left-0 bg-white group-hover:bg-[#E4E3E0]/30 font-bold">{record.folio}</td>
                      <td className="p-4 border-r border-[#141414]/5 sticky left-[100px] bg-white group-hover:bg-[#E4E3E0]/30 font-bold">{record.folio_intransferible}</td>
                      <td className="p-4 border-r border-[#141414]/5 sticky left-[200px] bg-white group-hover:bg-[#E4E3E0]/30 font-bold truncate max-w-[200px]">{record.nombre}</td>
                      <td className="p-4 border-r border-[#141414]/5">{record.curp}</td>
                      <td className="p-4 border-r border-[#141414]/5">{record.telefono}</td>
                      <td className="p-4 border-r border-[#141414]/5 truncate max-w-[200px]">{record.domicilio}</td>
                      <td className="p-4 border-r border-[#141414]/5">{record.tipo_localidad}</td>
                      <td className="p-4 border-r border-[#141414]/5">{formatDate(record.fecha_nacimiento)}</td>
                      <td className="p-4 border-r border-[#141414]/5 text-center">{record.reporte_mp}</td>
                      <td className="p-4 border-r border-[#141414]/5">{record.condicion}</td>
                      <td className="p-4 border-r border-[#141414]/5 text-center">{record.gestas}</td>
                      <td className="p-4 border-r border-[#141414]/5 text-center">{record.cesareas}</td>
                      <td className="p-4 border-r border-[#141414]/5">{formatDate(record.fecha_ultima_cesarea)}</td>
                      <td className="p-4 border-r border-[#141414]/5 text-center">{record.partos}</td>
                      <td className="p-4 border-r border-[#141414]/5 text-center">{record.abortos}</td>
                      <td className="p-4 border-r border-[#141414]/5">{formatDate(record.fecha_ultimo_aborto)}</td>
                      <td className="p-4 border-r border-[#141414]/5">{formatDate(record.fum)}</td>
                      <td className="p-4 border-r border-[#141414]/5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${record.riesgo_obstetrico <= 3 ? 'bg-emerald-100 text-emerald-700' :
                          record.riesgo_obstetrico <= 6 ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                          {record.riesgo_obstetrico}
                        </span>
                      </td>
                      <td className="p-4 border-r border-[#141414]/5">{record.factores_riesgo}</td>
                      <td className="p-4 border-r border-[#141414]/5">{record.riesgo_social}</td>
                      <td className="p-4 border-r border-[#141414]/5">{formatDate(record.salud_mental_fecha)}</td>
                      <td className="p-4 border-r border-[#141414]/5 text-center">{record.salud_mental_puntaje}</td>
                      <td className="p-4 border-r border-[#141414]/5">{record.tas}</td>
                      <td className="p-4 border-r border-[#141414]/5">{record.tad}</td>
                      <td className="p-4 border-r border-[#141414]/5">{record.tamiz_dm}</td>
                      <td className="p-4 border-r border-[#141414]/5">{record.bh_hb}</td>
                      <td className="p-4 border-r border-[#141414]/5 text-center">{record.tipo_sangre}</td>
                      <td className="p-4 border-r border-[#141414]/5 text-center">{record.rh}</td>
                      <td className="p-4 border-r border-[#141414]/5">{record.vih_resultado}</td>
                      <td className="p-4 border-r border-[#141414]/5">{formatDate(record.vih_fecha)}</td>
                      <td className="p-4 border-r border-[#141414]/5">{record.sifilis_resultado}</td>
                      <td className="p-4 border-r border-[#141414]/5">{formatDate(record.sifilis_fecha)}</td>
                      <td className="p-4 border-r border-[#141414]/5">{record.ego_resultado}</td>
                      <td className="p-4 border-r border-[#141414]/5">{formatDate(record.ego_fecha)}</td>
                      <td className="p-4 border-r border-[#141414]/5 text-center">{record.acido_folico}</td>
                      <td className="p-4 border-r border-[#141414]/5 text-center">{record.fumarato_ferroso}</td>
                      <td className="p-4 border-r border-[#141414]/5 text-center">{record.aas}</td>
                      <td className="p-4 border-r border-[#141414]/5 text-center">{record.calcio}</td>
                      <td className="p-4 border-r border-[#141414]/5">{record.estado_salud_actual}</td>
                      <td className="p-4 border-r border-[#141414]/5 text-center">{record.plan_seguridad}</td>
                      <td className="p-4 border-r border-[#141414]/5">{formatDate(record.plan_seguridad_fecha)}</td>
                      <td className="p-4 border-r border-[#141414]/5">{record.plan_manejo}</td>
                      <td className="p-4 border-r border-[#141414]/5">{record.ref_mater_hospital}</td>
                      <td className="p-4 border-r border-[#141414]/5 text-center">{record.ref_mater_acudio}</td>
                      <td className="p-4 border-r border-[#141414]/5">{record.ref_mater_resultado}</td>
                      <td className="p-4 border-r border-[#141414]/5">{record.ref_urgencias_hospital}</td>
                      <td className="p-4 border-r border-[#141414]/5 text-center">{record.ref_urgencias_acudio}</td>
                      <td className="p-4 border-r border-[#141414]/5">{record.ref_urgencias_resultado}</td>
                      <td className="p-4 border-r border-[#141414]/5 text-center">{record.derivacion_plataforma_comunitaria}</td>
                      <td className="p-4 border-r border-[#141414]/5 text-center">{record.control_parteria_tradicional}</td>
                      <td className="p-4 border-r border-[#141414]/5">{record.nombre_partera}</td>
                      <td className="p-4 border-r border-[#141414]/5">{record.conclusion_embarazo}</td>
                      <td className="p-4 border-r border-[#141414]/5 text-center">{record.sdg_nacimiento}</td>
                      <td className="p-4 border-r border-[#141414]/5">{formatDate(record.fecha_atencion_evento)}</td>
                      <td className="p-4 border-r border-[#141414]/5">{record.lugar_atencion_evento}</td>
                      <td className="p-4 border-r border-[#141414]/5">{record.estado_salud_materna_puerperio}</td>
                      <td className="p-4 border-r border-[#141414]/5">{record.rn_estado}</td>
                      <td className="p-4 border-r border-[#141414]/5">{record.rn_genero}</td>
                      <td className="p-4 border-r border-[#141414]/5">{record.rn_salud}</td>
                      <td className="p-4 border-r border-[#141414]/5">{formatDate(record.tamiz_metabolico_fecha)}</td>
                      <td className="p-4 border-r border-[#141414]/5 text-center">{record.tamiz_metabolico_sospechoso}</td>
                      <td className="p-4 border-r border-[#141414]/5">{formatDate(record.tamiz_auditivo_fecha)}</td>
                      <td className="p-4 border-r border-[#141414]/5 text-center">{record.tamiz_auditivo_sospechoso}</td>
                      <td className="p-4 border-r border-[#141414]/5">{record.mpf_eleccion}</td>
                      <td className="p-4 border-r border-[#141414]/5">{record.mpf_aplicado}</td>
                      <td className="p-4 border-r border-[#141414]/5">{record.motivo_rechazo_mpf}</td>
                      <td className="p-4 border-r border-[#141414]/5 truncate max-w-[200px]">{record.diagnostico_especifico}</td>
                      <td className="p-4 border-r border-[#141414]/5 text-center">{record.club_embarazadas}</td>
                      <td className="p-4 border-r border-[#141414]/5">{record.seguimiento_ts}</td>
                      <td className="p-4 border-r border-[#141414]/5">{formatDate(record.fecha_actualizacion_ts)}</td>
                      <td className="p-4 border-r border-[#141414]/5">{formatDate(record.fecha_ultima_consulta)}</td>
                      <td className="p-4 border-r border-[#141414]/5">{formatDate(record.fecha_proxima_cita)}</td>
                      <td className="p-4 border-r border-[#141414]/5">{record.medico_atencion}</td>
                      <td className="p-4 border-r border-[#141414]/5">{record.medico_nombre}</td>
                      <td className="p-4 border-r border-[#141414]/5">{record.medico_cedula}</td>
                      <td className="p-4 border-r border-[#141414]/5">{record.nucleo_nombre}</td>
                      <td className="p-4 font-bold">{formatDate(record.created_at)}</td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
