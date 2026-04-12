export interface CensusRecord {
  id?: number;
  folio?: string;
  nombre: string;
  curp: string;
  telefono: string;
  domicilio: string;
  reporte_mp: 'S' | 'N' | '';
  folio_intransferible: string;
  tipo_localidad: 'SEDE' | 'LAI';
  derechohabiencia: 'IMSS BIENESTAR OPD' | 'IMSS BIENESTAR PROGRAMA' | 'IMSS ORDINARIO' | 'ISSSTE' | 'ISSSTECH' | 'SEDENA' | 'OTRO' | '';
  fecha_nacimiento: string;
  condicion: 'EMBARAZADA DE PRIMERA VEZ' | 'EMBARAZADA SUBSECUENTE' | 'PUERPERA DE PRIMERA VEZ' | 'PUERPERA SUBSECUENTE';
  gestas: number;
  cesareas: number;
  fecha_ultima_cesarea: string;
  partos: number;
  abortos: number;
  fecha_ultimo_aborto: string;
  fum: string;
  riesgo_obstetrico: number;
  factores_riesgo: string;
  riesgo_social: string;
  salud_mental_fecha: string;
  salud_mental_puntaje: number;
  tas: number;
  tad: number;
  td_fecha_1ra: string;
  td_fecha_2da: string;
  td_fecha_3ra: string;
  tdpa_fecha: string;
  influenza_fecha: string;
  tamiz_dm: string;
  bh_hb: string;
  tipo_sangre: 'A' | 'B' | 'AB' | 'O' | '';
  rh: 'Positivo' | 'Negativo' | '';
  vih_resultado: 'Reactivo' | 'No Reactivo' | '';
  vih_fecha: string;
  sifilis_resultado: 'Reactivo' | 'No Reactivo' | '';
  sifilis_fecha: string;
  ego_resultado: 'Normal' | 'Proteinuria' | 'IVU' | '';
  ego_fecha: string;
  acido_folico: 'S' | 'N';
  fumarato_ferroso: 'S' | 'N';
  aas: 'S' | 'N';
  calcio: 'S' | 'N';
  estado_salud_actual: string;
  plan_seguridad: 'S' | 'N';
  plan_seguridad_fecha: string;
  plan_manejo: string;
  ref_mater_hospital: string;
  ref_mater_acudio: 'S' | 'N' | '';
  ref_mater_resultado: string;
  ref_urgencias_hospital: string;
  ref_urgencias_acudio: 'S' | 'N' | '';
  ref_urgencias_resultado: string;
  derivacion_plataforma_comunitaria: 'S' | 'N' | '';
  control_parteria_tradicional: 'S' | 'N' | '';
  nombre_partera: string;
  conclusion_embarazo: 'Parto' | 'Cesárea' | 'Aborto' | '';
  sdg_nacimiento: number;
  fecha_atencion_evento: string;
  lugar_atencion_evento: string;
  estado_salud_materna_puerperio: string;
  rn_estado: 'Vivo' | 'Muerto' | '';
  rn_genero: 'Masculino' | 'Femenino' | '';
  rn_salud: 'Sano' | 'Enfermo' | '';
  tamiz_metabolico_fecha: string;
  tamiz_metabolico_sospechoso: 'S' | 'N' | '';
  tamiz_auditivo_fecha: string;
  tamiz_auditivo_sospechoso: 'S' | 'N' | '';
  mpf_eleccion: string;
  mpf_aplicado: string;
  motivo_rechazo_mpf: string;
  diagnostico_especifico: string;
  plan_manejo_puerperio: string;
  club_embarazadas: 'S' | 'N';
  seguimiento_ts: string;
  fecha_actualizacion_ts: string;
  fecha_ultima_consulta: string;
  fecha_proxima_cita: string;
  medico_nombre: string;
  medico_cedula: string;
  medico_atencion: string;
  nucleo_nombre: string;
  fecha_usg_reciente: string;
  conclusiones_usg: string;
  observaciones_generales?: string;
  is_historical?: number;
  created_at?: string;
  health_unit_id?: number;
  health_unit_name?: string;
  health_unit_clues?: string;
  zona_id?: number;
  zona_name?: string;
  region_id?: number;
  region_name?: string;
  estado_id?: number;
  estado_name?: string;
}

export interface User {
  id: number;
  username: string;
  role: 'ADMIN' | 'ESTATAL' | 'REGIONAL' | 'ZONAL' | 'UNIT_USER';
  health_unit_id: number | null;
  health_unit_name?: string;
  health_unit_clues?: string;
  estado_id: number | null;
  estado_name?: string;
  region_id: number | null;
  region_name?: string;
  zona_id: number | null;
  zona_name?: string;
}

export interface HealthUnit {
  id: number;
  nombre: string;
  clues: string;
  zona_id: number | null;
  created_at: string;
}

export interface Estado {
  id: number;
  nombre: string;
}

export interface Region {
  id: number;
  nombre: string;
  estado_id: number;
  estado_nombre?: string;
}

export interface Zona {
  id: number;
  nombre: string;
  region_id: number;
  region_nombre?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Nucleo {
  id?: number;
  health_unit_id?: number;
  nombre: string;
  medico_nombre: string;
  medico_cedula: string;
}
