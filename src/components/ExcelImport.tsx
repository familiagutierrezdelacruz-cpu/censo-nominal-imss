import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, X, Download, HelpCircle } from 'lucide-react';
import { cn } from '../utils/cn';
import { format, parseISO, isValid, addDays } from 'date-fns';

const COLUMN_MAPPING: Record<string, string[]> = {
  nombre: ['nombre', 'paciente', 'embarazada', 'nombre completo', 'nombre de la embarazada'],
  curp: ['curp', 'clave unica', 'clave única', 'clave unica de registro de poblacion'],
  telefono: ['telefono', 'teléfono', 'celular', 'contacto', 'tel'],
  domicilio: ['domicilio', 'dirección', 'direccion', 'calle', 'ubicacion'],
  reporte_mp: ['reporte mp', 'mp', 'medicina preventiva'],
  folio_intransferible: ['folio intransferible', 'folio secretaria', 'folio federal'],
  tipo_localidad: ['tipo de localidad', 'localidad tipo', 'tipo localidad'],
  fecha_nacimiento: ['fecha de nacimiento', 'nacimiento', 'fecha nacimiento', 'f. nac'],
  condicion: ['condicion', 'condición', 'estado'],
  gestas: ['gestas', 'g', 'embarazos', 'número de gestas'],
  cesareas: ['cesareas', 'cesáreas', 'c'],
  partos: ['partos', 'p'],
  abortos: ['abortos', 'a'],
  fecha_ultima_cesarea: ['fecha ultima cesarea', 'f. ult. cesarea'],
  fecha_ultimo_aborto: ['fecha ultimo aborto', 'f. ult. aborto'],
  fum: ['fum', 'ultima menstruacion', 'f.u.m.', 'fecha de ultima menstruacion'],
  riesgo_obstetrico: ['riesgo obstetrico', 'riesgo', 'puntaje riesgo', 'coopland'],
  factores_riesgo: ['factores de riesgo', 'factores', 'observaciones riesgo'],
  riesgo_social: ['riesgo social', 'social'],
  tas: ['tas', 'tension sistolica', 'presion sistolica'],
  tad: ['tad', 'tension diastolica', 'presion diastolica'],
  tamiz_dm: ['tamiz dm', 'glucosa', 'diabetes'],
  bh_hb: ['bh hb', 'hemoglobina', 'hb'],
  vih_resultado: ['vih resultado', 'vih'],
  sifilis_resultado: ['sifilis resultado', 'sifilis', 'v d r l', 'vdrl'],
  ego_resultado: ['ego resultado', 'ego', 'examen de orina'],
  tipo_sangre: ['tipo de sangre', 'grupo sanguineo', 'sangre', 'blood type'],
  rh: ['factor rh', 'rh'],
  acido_folico: ['acido folico'],
  fumarato_ferroso: ['fumarato ferroso', 'hierro'],
  aas: ['aas', 'aspirina'],
  calcio: ['calcio'],
  estado_salud_actual: ['estado de salud', 'estado salud'],
  medico_nombre: ['medico', 'médico', 'nombre del medico'],
  nucleo_nombre: ['nucleo', 'núcleo'],
};

const normalizeHeader = (header: string): string => {
  const cleanHeader = header.toLowerCase().trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Remove accents

  for (const [key, synonyms] of Object.entries(COLUMN_MAPPING)) {
    if (key === cleanHeader) return key;
    if (synonyms.some(s => s.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === cleanHeader)) {
      return key;
    }
  }
  return cleanHeader.replace(/\s+/g, '_');
};

const parseExcelDate = (value: any): string => {
  if (!value) return '';

  // If it's a number (Excel serial date)
  if (typeof value === 'number') {
    // Excel base date is 1899-12-30
    const date = addDays(new Date(1899, 11, 30), value);
    if (isValid(date)) return format(date, 'yyyy-MM-dd');
  }

  // If it's a string
  if (typeof value === 'string') {
    const cleanValue = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanValue)) return cleanValue;

    // Try DD/MM/YYYY
    const dmy = cleanValue.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (dmy) {
      const date = new Date(parseInt(dmy[3]), parseInt(dmy[2]) - 1, parseInt(dmy[1]));
      if (isValid(date)) return format(date, 'yyyy-MM-dd');
    }

    // Try YYYY/MM/DD
    const ymd = cleanValue.match(/^(\d{4})[/-](\d{2})[/-](\d{2})$/);
    if (ymd) {
      const date = new Date(parseInt(ymd[1]), parseInt(ymd[2]) - 1, parseInt(ymd[3]));
      if (isValid(date)) return format(date, 'yyyy-MM-dd');
    }

    const isoDate = parseISO(cleanValue);
    if (isValid(isoDate)) return format(isoDate, 'yyyy-MM-dd');
  }

  return value?.toString() || '';
};

const validateCURP = (curp: string) => /^[A-Z]{4}[0-9]{6}[H,M][A-Z]{5}[0-9,A-Z][0-9]$/.test(curp?.toString().toUpperCase().trim());

interface ExcelImportProps {
  token: string;
  onImportSuccess: () => void;
  onClose: () => void;
}

export default function ExcelImport({ token, onImportSuccess, onClose }: ExcelImportProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [preview, setPreview] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, valid: 0, invalid: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(worksheet);

        if (rawData.length === 0) {
          setError('El archivo está vacío');
          return;
        }

        const mappedData = rawData.map((row: any) => {
          const normalizedRow: any = { _errors: [] };

          Object.keys(row).forEach(key => {
            const normalizedKey = normalizeHeader(key);
            let value = row[key];

            // Special handling for dates
            if (['fum', 'fecha_nacimiento', 'fecha_ultima_cesarea', 'fecha_ultimo_aborto', 'salud_mental_fecha', 'vih_fecha', 'sifilis_fecha', 'ego_fecha', 'plan_seguridad_fecha', 'fecha_atencion_evento', 'tamiz_metabolico_fecha', 'tamiz_auditivo_fecha', 'fecha_actualizacion_ts', 'fecha_ultima_consulta', 'fecha_proxima_cita'].includes(normalizedKey)) {
              value = parseExcelDate(value);
            }

            normalizedRow[normalizedKey] = value;
          });

          // Basic Validation
          if (!normalizedRow.nombre) normalizedRow._errors.push('Nombre es requerido');
          if (normalizedRow.curp && !validateCURP(normalizedRow.curp)) normalizedRow._errors.push('CURP inválido');
          if (!normalizedRow.condicion) normalizedRow.condicion = 'EMBARAZADA'; // Default

          return normalizedRow;
        });

        setPreview(mappedData);
        setStats({
          total: mappedData.length,
          valid: mappedData.filter(r => r._errors.length === 0).length,
          invalid: mappedData.filter(r => r._errors.length > 0).length
        });
      } catch (err) {
        console.error(err);
        setError('Error al leer el archivo Excel. Asegúrate de que sea un formato válido (.xlsx, .xls)');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    if (preview.length === 0) return;

    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/census/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(preview),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Se procesaron ${data.count} registros: ${data.imported} nuevos, ${data.updated} actualizados.`);
        setTimeout(() => {
          onImportSuccess();
          onClose();
        }, 2000);
      } else {
        setError(data.error || 'Error al importar los datos');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        nombre: 'JUANA PEREZ LOPEZ',
        curp: 'PELJ800101HDFRRN01',
        telefono: '5551234567',
        domicilio: 'CALLE FALSA 123',
        reporte_mp: 'N',
        folio_intransferible: '123456',
        tipo_localidad: 'SEDE',
        fecha_nacimiento: '1980-01-01',
        condicion: 'EMBARAZADA DE PRIMERA VEZ',
        gestas: 1,
        cesareas: 0,
        fecha_ultima_cesarea: '',
        partos: 0,
        abortos: 0,
        fecha_ultimo_aborto: '',
        fum: '2024-01-01',
        riesgo_obstetrico: 2,
        factores_riesgo: 'Ninguno',
        riesgo_social: 'Bajo',
        salud_mental_fecha: '',
        salud_mental_puntaje: 0,
        tas: 110,
        tad: 70,
        tamiz_dm: 'Normal',
        bh_hb: '12.5',
        vih_resultado: 'No Reactivo',
        vih_fecha: '',
        sifilis_resultado: 'No Reactivo',
        sifilis_fecha: '',
        ego_resultado: 'Normal',
        ego_fecha: '',
        acido_folico: 'S',
        fumarato_ferroso: 'S',
        aas: 'N',
        calcio: 'S',
        estado_salud_actual: 'Bueno',
        plan_seguridad: 'S',
        plan_seguridad_fecha: '',
        plan_manejo: 'Seguimiento normal',
        ref_mater_hospital: '',
        ref_mater_acudio: '',
        ref_mater_resultado: '',
        ref_urgencias_hospital: '',
        ref_urgencias_acudio: '',
        ref_urgencias_resultado: '',
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
        club_embarazadas: 'S',
        seguimiento_ts: '',
        fecha_actualizacion_ts: '',
        fecha_ultima_consulta: '2024-02-01',
        fecha_proxima_cita: '2024-03-01',
        medico_nombre: 'DR. GARCIA',
        medico_cedula: '1234567',
        medico_atencion: 'DR. GARCIA',
        nucleo_nombre: 'NUCLEO 1'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla Completa");
    XLSX.writeFile(wb, "plantilla_censo_materno_completa.xlsx");
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#141414]/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="bg-[#141414] p-6 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#E4E3E0] rounded-lg flex items-center justify-center">
              <Upload className="text-[#141414] w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[#E4E3E0] font-serif italic text-xl tracking-tight">Importar desde Excel</h2>
              <p className="text-[#E4E3E0]/50 text-[10px] uppercase tracking-widest font-bold">Carga masiva de registros</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#E4E3E0]/50 hover:text-[#E4E3E0] transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl flex items-center gap-3 text-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <p>{success}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-6 border-2 border-dashed border-[#141414]/10 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 hover:border-[#141414]/20 transition-all">
                <div className="w-12 h-12 bg-[#E4E3E0] rounded-full flex items-center justify-center">
                  <FileSpreadsheet className="text-[#141414] w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-sm">Selecciona tu archivo</p>
                  <p className="text-xs opacity-50">Formatos soportados: .xlsx, .xls</p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".xlsx, .xls"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-[#141414] text-[#E4E3E0] px-6 py-2 rounded-xl text-xs font-bold tracking-widest hover:opacity-90 transition-all"
                >
                  BUSCAR ARCHIVO
                </button>
              </div>

              <div className="bg-[#E4E3E0]/30 p-6 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-[#141414]/60">
                  <Download className="w-4 h-4" />
                  <p className="text-[10px] uppercase tracking-widest font-bold">Instrucciones</p>
                </div>
                <ul className="text-xs space-y-2 opacity-70 list-disc pl-4">
                  <li>El sistema intenta identificar las columnas automáticamente (ej. "Paciente" → "nombre").</li>
                  <li>Las fechas pueden estar en formato Excel o texto (DD/MM/AAAA).</li>
                  <li>Si la CURP ya existe en tu unidad, el registro <strong>se actualizará</strong> con la nueva información.</li>
                  <li>Los registros con errores (marcados en rojo) no podrán ser procesados.</li>
                </ul>
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={downloadTemplate}
                    className="text-[#141414] text-[10px] font-bold underline uppercase tracking-widest hover:opacity-70 transition-all text-left"
                  >
                    Descargar Plantilla de Ejemplo
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <p className="text-[10px] uppercase tracking-widest font-bold opacity-50">Vista Previa ({preview.length} registros)</p>
                  {stats.invalid > 0 && (
                    <span className="bg-red-100 text-red-600 text-[9px] px-2 py-0.5 rounded-full font-bold">
                      {stats.invalid} CON ERRORES
                    </span>
                  )}
                </div>
                {preview.length > 0 && (
                  <button onClick={() => { setPreview([]); setStats({ total: 0, valid: 0, invalid: 0 }); }} className="text-red-500 text-[10px] font-bold uppercase tracking-widest hover:underline">
                    Limpiar
                  </button>
                )}
              </div>
              <div className="border border-[#141414]/10 rounded-2xl overflow-hidden h-[300px] overflow-y-auto bg-white">
                {preview.length === 0 ? (
                  <div className="h-full flex items-center justify-center opacity-20 italic text-sm">
                    No hay datos cargados
                  </div>
                ) : (
                  <table className="w-full text-[10px] text-left">
                    <thead className="bg-[#141414] text-[#E4E3E0] sticky top-0">
                      <tr>
                        <th className="p-2">Nombre</th>
                        <th className="p-2">CURP</th>
                        <th className="p-2">Condición</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#141414]/5">
                      {preview.slice(0, 50).map((row, i) => (
                        <tr key={i} className={cn("hover:bg-[#E4E3E0]/20", row._errors.length > 0 && "bg-red-50")}>
                          <td className="p-2 font-bold">
                            <div className="flex flex-col">
                              {row.nombre}
                              {row._errors.length > 0 && (
                                <span className="text-red-500 text-[8px] uppercase">{row._errors.join(', ')}</span>
                              )}
                            </div>
                          </td>
                          <td className="p-2 opacity-50 uppercase">{row.curp}</td>
                          <td className="p-2 whitespace-nowrap">{row.condicion}</td>
                        </tr>
                      ))}
                      {preview.length > 50 && (
                        <tr>
                          <td colSpan={3} className="p-2 text-center opacity-30 italic">
                            ... y {preview.length - 50} registros más
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-[#E4E3E0]/30 border-t border-[#141414]/10 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-8 py-3 rounded-xl text-xs font-bold tracking-widest hover:bg-[#141414]/5 transition-all"
          >
            CANCELAR
          </button>
          <button
            onClick={handleImport}
            disabled={loading || preview.length === 0 || stats.invalid > 0}
            className="bg-[#141414] text-[#E4E3E0] px-8 py-3 rounded-xl text-xs font-bold tracking-widest hover:opacity-90 transition-all disabled:opacity-30 shadow-lg flex items-center gap-2"
          >
            {loading ? 'IMPORTANDO...' : 'CONFIRMAR IMPORTACIÓN'}
            {stats.invalid > 0 && <HelpCircle className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
