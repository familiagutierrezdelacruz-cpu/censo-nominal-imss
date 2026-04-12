import React from 'react';
import { CensusRecord, User as UserType } from '../types/census';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { calculateAge, calculateSDG, calculateDaysSinceUpdate, calculatePuerperioDays } from '../utils/calculations';
import { LayoutDashboard, Users, Clock, AlertTriangle } from 'lucide-react';

interface DashboardProps {
  records: CensusRecord[];
  user: UserType | null;
  onUpdate: (record: CensusRecord) => void;
  onArchive: (id: number) => void;
}

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444'];

export default function Dashboard({ records, user, onUpdate, onArchive }: DashboardProps) {
  // Filter for currently pregnant women (excluding historical)
  const pregnantRecords = records.filter(r => Number(r.is_historical) !== 1 && r.condicion.startsWith('EMBARAZADA'));
  const pregnantPrimeraVez = pregnantRecords.filter(r => r.condicion === 'EMBARAZADA DE PRIMERA VEZ');
  const pregnantSubsecuente = pregnantRecords.filter(r => r.condicion === 'EMBARAZADA SUBSECUENTE');

  // Filter for postpartum women (puerperas)
  const puerperasRecords = records.filter(r => Number(r.is_historical) !== 1 && r.condicion.startsWith('PUERPERA'));
  const puerperasPrimeraVez = puerperasRecords.filter(r => r.condicion === 'PUERPERA DE PRIMERA VEZ');
  const puerperasSubsecuente = puerperasRecords.filter(r => r.condicion === 'PUERPERA SUBSECUENTE');

  // 1. Pregnant Age Distribution
  const ageData = [
    { name: '≤ 15 años', value: 0 },
    { name: '16 - 18 años', value: 0 },
    { name: '19 - 37 años', value: 0 },
    { name: '> 37 años', value: 0 },
  ];

  pregnantRecords.forEach(r => {
    const age = calculateAge(r.fecha_nacimiento);
    if (age <= 15) ageData[0].value++;
    else if (age <= 18) ageData[1].value++;
    else if (age <= 37) ageData[2].value++;
    else ageData[3].value++;
  });

  // 2. Stale Consultations (> 30 days for pregnant, > 7 days for puerperas)
  const stalePregnant = pregnantRecords.filter(r => calculateDaysSinceUpdate(r.fecha_ultima_consulta) > 30);
  const stalePuerperas = puerperasRecords.filter(r => calculateDaysSinceUpdate(r.fecha_ultima_consulta) > 7);

  const staleData = [
    { name: 'Emb. Actualizadas', value: pregnantRecords.length - stalePregnant.length },
    { name: 'Emb. > 30d', value: stalePregnant.length },
    { name: 'Puérp. Actualizadas', value: puerperasRecords.length - stalePuerperas.length },
    { name: 'Puérp. > 7d', value: stalePuerperas.length },
  ];

  // 3. Overdue Pregnancies (> 41 SDG)
  const overduePregnancies = pregnantRecords.filter(r => {
    const sdgStr = calculateSDG(r.fum);
    const sdgMatch = sdgStr.match(/^(\d+)/);
    if (sdgMatch) {
      const sdgValue = parseInt(sdgMatch[1], 10);
      return sdgValue >= 41;
    }
    return false;
  });

  // 4. Term Pregnancies (37 - 40.6 SDG)
  const termPregnancies = pregnantRecords.filter(r => {
    const sdgStr = calculateSDG(r.fum);
    const sdgMatch = sdgStr.match(/^(\d+) sem (\d+) d/);
    if (sdgMatch) {
      const weeks = parseInt(sdgMatch[1], 10);
      return weeks >= 37 && weeks <= 40;
    }
    return false;
  });

  // 4. Coopland Risk Distribution (Pregnant Only)
  const riskData = [
    { name: 'Bajo Riesgo (0-3)', value: 0 },
    { name: 'Riesgo Moderado (4-6)', value: 0 },
    { name: 'Alto Riesgo (> 6)', value: 0 },
  ];

  pregnantRecords.forEach(r => {
    const score = r.riesgo_obstetrico || 0;
    if (score <= 3) riskData[0].value++;
    else if (score <= 6) riskData[1].value++;
    else riskData[2].value++;
  });

  // 5. Nucleo Distribution
  const nucleoMap = new Map<string, number>();
  [...pregnantRecords, ...puerperasRecords].forEach(r => {
    const name = r.nucleo_nombre || 'Sin Asignar';
    nucleoMap.set(name, (nucleoMap.get(name) || 0) + 1);
  });

  const nucleoData = Array.from(nucleoMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // 7. Postpartum Alerts (> 42 days)
  const overduePuerperas = puerperasRecords.filter(r => {
    const days = calculatePuerperioDays(r.fecha_atencion_evento);
    return days >= 42;
  });

  // 6. Hierarchical Breakdown
  const getSubEntityKey = (r: CensusRecord) => {
    if (user?.role === 'ADMIN') return r.estado_id ? `E-${r.estado_id}|${r.estado_name}` : 'E-0|Sin Estado';
    if (user?.role === 'ESTATAL') return r.region_id ? `R-${r.region_id}|${r.region_name}` : 'R-0|Sin Región';
    if (user?.role === 'REGIONAL') return r.zona_id ? `Z-${r.zona_id}|${r.zona_name}` : 'Z-0|Sin Zona';
    if (user?.role === 'ZONAL') return r.health_unit_id ? `U-${r.health_unit_id}|${r.health_unit_name}` : 'U-0|Sin Unidad';
    return r.nucleo_nombre ? `N-${r.nucleo_nombre}|${r.nucleo_nombre}` : 'N-0|Sin Núcleo';
  };

  const hierarchyGroups = new Map<string, { total: number, highRisk: number, overdue: number, term: number }>();

  records.filter(r => Number(r.is_historical) !== 1).forEach(r => {
    const key = getSubEntityKey(r);
    const current = hierarchyGroups.get(key) || { total: 0, highRisk: 0, overdue: 0, term: 0 };
    const isPregnant = r.condicion.startsWith('EMBARAZADA');

    current.total++;
    
    // Only count high risk for pregnant women to match summary stats
    if (isPregnant && (r.riesgo_obstetrico || 0) > 6) {
      current.highRisk++;
    }

    // Overdue/Term check (only for currently pregnant women)
    if (isPregnant) {
      const sdgStr = calculateSDG(r.fum);
      const sdgMatch = sdgStr.match(/^(\d+) sem (\d+) d/);
      if (sdgMatch) {
        const weeks = parseInt(sdgMatch[1], 10);
        if (weeks >= 41) {
          current.overdue++;
        } else if (weeks >= 37 && weeks <= 40) {
          current.term++;
        }
      }
    }

    hierarchyGroups.set(key, current);
  });

  const hierarchyData = Array.from(hierarchyGroups.entries()).map(([key, stats]) => {
    const [id, name] = key.split('|');
    return { id, name, ...stats };
  }).sort((a, b) => b.total - a.total);

  const StatCard = ({ title, value, icon: Icon, colorClass }: { title: string, value: number, icon: any, colorClass: string }) => (
    <div className="bg-white p-6 rounded-2xl border border-[#141414]/10 shadow-sm flex items-center gap-4">
      <div className={`p-3 rounded-xl ${colorClass}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-widest font-bold opacity-50">{title}</p>
        <p className="text-2xl font-mono font-bold">{value}</p>
      </div>
    </div>
  );

  const getHierarchyTitle = () => {
    if (user?.role === 'ADMIN') return 'Desglose por Estado';
    if (user?.role === 'ESTATAL') return 'Desglose por Región';
    if (user?.role === 'REGIONAL') return 'Desglose por Zona';
    if (user?.role === 'ZONAL') return 'Desglose por Unidad de Salud';
    return 'Desglose por Núcleo Básico';
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center gap-3">
        <LayoutDashboard className="w-8 h-8" />
        <div>
          <h2 className="text-2xl font-serif italic">Dashboard</h2>
          <p className="text-xs opacity-50 uppercase tracking-widest font-bold">
            Indicadores para: {user?.role === 'ADMIN' ? 'Tablero National' : (
              user?.health_unit_name ||
              user?.zona_name ||
              user?.region_name ||
              user?.estado_name ||
              'Mi Nivel'
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Embarazadas"
          value={pregnantRecords.length}
          icon={Users}
          colorClass="bg-emerald-100 text-emerald-600"
        />
        <StatCard
          title="Emb. Primera Vez"
          value={pregnantPrimeraVez.length}
          icon={Users}
          colorClass="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          title="Emb. Subsecuentes"
          value={pregnantSubsecuente.length}
          icon={Users}
          colorClass="bg-emerald-100 text-emerald-700"
        />
        <StatCard
          title={"Sin Consulta > 30d (Emb)"}
          value={stalePregnant.length}
          icon={Clock}
          colorClass="bg-amber-100 text-amber-600"
        />

        <StatCard
          title="Total Puérperas"
          value={puerperasRecords.length}
          icon={Users}
          colorClass="bg-blue-100 text-blue-600"
        />
        <StatCard
          title="Puérperas Primera Vez"
          value={puerperasPrimeraVez.length}
          icon={Users}
          colorClass="bg-blue-50 text-blue-700"
        />
        <StatCard
          title="Puérperas Subsecuente"
          value={puerperasSubsecuente.length}
          icon={Users}
          colorClass="bg-blue-100 text-blue-700"
        />
        <StatCard
          title={"Sin Consulta > 7d (Puérp)"}
          value={stalePuerperas.length}
          icon={Clock}
          colorClass="bg-red-100 text-red-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Hierarchy Breakdown Table (New) */}
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-[#141414]/10 shadow-sm overflow-hidden">
          <h3 className="font-serif italic text-lg mb-6 border-b border-[#141414]/5 pb-2">{getHierarchyTitle()}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#141414]/5">
                  <th className="pb-4 text-[10px] uppercase tracking-widest font-bold opacity-50">Nombre</th>
                  <th className="pb-4 text-[10px] uppercase tracking-widest font-bold opacity-50 text-center">Total Pacientes</th>
                  <th className="pb-4 text-[10px] uppercase tracking-widest font-bold opacity-50 text-center">Alto Riesgo</th>
                  <th className="pb-4 text-[10px] uppercase tracking-widest font-bold opacity-50 text-center">Emb. Término (37-40.6)</th>
                  <th className="pb-4 text-[10px] uppercase tracking-widest font-bold opacity-50 text-center">Emb. Prolongados ({'>'}41)</th>
                </tr>
              </thead>
              <tbody>
                {hierarchyData.map((row) => (
                  <tr key={row.id} className="border-b border-[#141414]/5 hover:bg-[#141414]/[0.02] transition-colors">
                    <td className="py-4 font-bold text-sm">{row.name}</td>
                    <td className="py-4 text-center font-mono">{row.total}</td>
                    <td className="py-4 text-center">
                      <span className={`font-mono font-bold ${row.highRisk > 0 ? 'text-red-500' : 'opacity-30'}`}>
                        {row.highRisk}
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      <span className={`font-mono font-bold ${row.term > 0 ? 'text-blue-600' : 'opacity-30'}`}>
                        {row.term}
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      <span className={`font-mono font-bold ${row.overdue > 0 ? 'text-red-600' : 'opacity-30'}`}>
                        {row.overdue}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Age Distribution Chart */}
        <div className="bg-white p-8 rounded-2xl border border-[#141414]/10 shadow-sm">
          <h3 className="font-serif italic text-lg mb-6 border-b border-[#141414]/5 pb-2">Distribución por Edad (Embarazadas)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ageData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {ageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Coopland Risk Distribution Chart */}
        <div className="bg-white p-8 rounded-2xl border border-[#141414]/10 shadow-sm">
          <h3 className="font-serif italic text-lg mb-6 border-b border-[#141414]/5 pb-2">Distribución por Riesgo (Coopland)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  <Cell fill="#10b981" /> {/* Bajo */}
                  <Cell fill="#f59e0b" /> {/* Moderado */}
                  <Cell fill="#ef4444" /> {/* Alto */}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stale Consultations Chart */}
        <div className="bg-white p-8 rounded-2xl border border-[#141414]/10 shadow-sm">
          <h3 className="font-serif italic text-lg mb-6 border-b border-[#141414]/5 pb-2">Seguimiento de Consultas (Días sin Atención)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={staleData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#14141410" />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#14141405' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {staleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#10b981' : (index === 1 ? '#f59e0b' : '#ef4444')} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary Table for Critical Cases */}
        <div className="bg-white p-8 rounded-2xl border border-[#141414]/10 shadow-sm">
          <h3 className="font-serif italic text-lg mb-6 border-b border-[#141414]/5 pb-2">Resumen de Riesgo y Alertas</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-xl border border-red-100">
              <span className="text-xs font-bold text-red-700 uppercase tracking-wider">Alto Riesgo Obstetrico</span>
              <span className="text-xl font-mono font-bold text-red-700">{riskData[2].value}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-amber-50 rounded-xl border border-amber-100">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Riesgo Moderado</span>
              <span className="text-xl font-mono font-bold text-amber-700">{riskData[1].value}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl border border-blue-100">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Emb. a Término (37 - 40.6 SDG)</span>
              <span className="text-xl font-mono font-bold text-blue-700">{termPregnancies.length}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-xl border border-red-100">
              <span className="text-xs font-bold text-red-700 uppercase tracking-wider">Emb. Prolongados (≥ 41 SDG)</span>
              <span className="text-xl font-mono font-bold text-red-700">{overduePregnancies.length}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Emb. Adolescentes (≤ 15 años)</span>
              <span className="text-xl font-mono font-bold text-emerald-700">{ageData[0].value}</span>
            </div>
          </div>
        </div>

        {/* Nucleo Distribution Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-[#141414]/10 shadow-sm">
          <h3 className="font-serif italic text-lg mb-6 border-b border-[#141414]/5 pb-2">Distribución de Pacientes por Núcleo Básico</h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={nucleoData} layout="vertical" margin={{ left: 40, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#14141410" />
                <XAxis type="number" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" fontSize={10} axisLine={false} tickLine={false} width={120} />
                <Tooltip cursor={{ fill: '#14141405' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} fill="#005944">
                  {nucleoData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#005944' : '#B38E5D'} opacity={0.8 + (index * -0.05)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* OVERDUE ALERTS SECTION */}
        {overduePregnancies.length > 0 && (
          <div className="lg:col-span-2 bg-red-50 p-8 rounded-3xl border border-red-200 shadow-sm animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="w-8 h-8 text-red-600" />
              <div>
                <h3 className="font-serif italic text-2xl text-red-900">Embarazadas ≥ 41 Semanas</h3>
                <p className="text-xs text-red-700/60 uppercase tracking-widest font-bold">Pacientes que requieren cambio de condición o atención inmediata</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-red-200 text-red-800">
                    <th className="pb-4 text-[10px] uppercase tracking-widest font-bold">Nombre</th>
                    <th className="pb-4 text-[10px] uppercase tracking-widest font-bold">Folio</th>
                    <th className="pb-4 text-[10px] uppercase tracking-widest font-bold">SDG (FUR)</th>
                    <th className="pb-4 text-[10px] uppercase tracking-widest font-bold text-right">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {overduePregnancies.map((p) => (
                    <tr key={p.id} className="border-b border-red-100 hover:bg-red-100/50 transition-colors">
                      <td className="py-4 font-bold text-red-900">{p.nombre}</td>
                      <td className="py-2 text-sm text-red-700 font-mono">{p.folio}</td>
                      <td className="py-2 text-sm font-bold text-red-800 bg-white/50 px-3 rounded-lg w-fit">{calculateSDG(p.fum)}</td>
                      <td className="py-2 text-right">
                        <button
                          onClick={() => {
                            if (window.confirm(`¿Desea pasar a la paciente ${p.nombre} a PUERPERA DE PRIMERA VEZ?`)) {
                              onUpdate({ ...p, condicion: 'PUERPERA DE PRIMERA VEZ' });
                            }
                          }}
                          className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-700 transition-all shadow-sm"
                        >
                          PASAR A PUERPERIO
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {overduePuerperas.length > 0 && (
          <div className="lg:col-span-2 bg-blue-50 p-8 rounded-3xl border border-blue-200 shadow-sm animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="w-8 h-8 text-blue-600" />
              <div>
                <h3 className="font-serif italic text-2xl text-blue-900">Puérperas ≥ 42 Días</h3>
                <p className="text-xs text-blue-700/60 uppercase tracking-widest font-bold">Pacientes que superan el periodo de puerperio</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-blue-200 text-blue-800">
                    <th className="pb-4 text-[10px] uppercase tracking-widest font-bold">Nombre</th>
                    <th className="pb-4 text-[10px] uppercase tracking-widest font-bold">Folio</th>
                    <th className="pb-4 text-[10px] uppercase tracking-widest font-bold">Días Puerperio</th>
                    <th className="pb-4 text-[10px] uppercase tracking-widest font-bold text-right">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {overduePuerperas.map((p) => (
                    <tr key={p.id} className="border-b border-blue-100 hover:bg-blue-100/50 transition-colors">
                      <td className="py-4 font-bold text-blue-900">{p.nombre}</td>
                      <td className="py-2 text-sm text-blue-700 font-mono">{p.folio}</td>
                      <td className="py-2 text-sm font-bold text-blue-800 bg-white/50 px-3 rounded-lg w-fit">
                        {calculatePuerperioDays(p.fecha_atencion_evento)} días
                      </td>
                      <td className="py-2 text-right">
                        <button
                          onClick={() => {
                            if (window.confirm(`¿Desea mover a la paciente ${p.nombre} al archivo HISTÓRICO?`)) {
                              onArchive(p.id!);
                            }
                          }}
                          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-sm"
                        >
                          ARCHIVAR HISTÓRICO
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
