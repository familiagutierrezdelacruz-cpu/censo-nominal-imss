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
import { calculateAge, calculateSDG, calculateDaysSinceUpdate } from '../utils/calculations';
import { LayoutDashboard, Users, Clock, AlertTriangle } from 'lucide-react';

interface DashboardProps {
  records: CensusRecord[];
  user: UserType | null;
}

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444'];

export default function Dashboard({ records, user }: DashboardProps) {
  // Filter for currently pregnant women (excluding historical)
  const pregnantRecords = records.filter(r => Number(r.is_historical) !== 1 && r.condicion.startsWith('EMBARAZADA'));

  // Filter for postpartum women (puerperas)
  const puerperasRecords = records.filter(r => Number(r.is_historical) !== 1 && r.condicion.startsWith('PUERPERA'));

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
      return sdgValue > 41;
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

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center gap-3">
        <LayoutDashboard className="w-8 h-8" />
        <div>
          <h2 className="text-2xl font-serif italic">Dashboard</h2>
          <p className="text-xs opacity-50 uppercase tracking-widest font-bold">
            Indicadores para: {records[0] && user?.role !== 'ADMIN' ? (user?.health_unit_name || 'Mi Unidad') : 'Todas las Unidades'}
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
          title="Total Puérperas"
          value={puerperasRecords.length}
          icon={Users}
          colorClass="bg-blue-100 text-blue-600"
        />
        <StatCard
          title={"Sin Consulta > 30d (Emb)"}
          value={stalePregnant.length}
          icon={Clock}
          colorClass="bg-amber-100 text-amber-600"
        />
        <StatCard
          title={"Sin Consulta > 7d (Puérp)"}
          value={stalePuerperas.length}
          icon={Clock}
          colorClass="bg-red-100 text-red-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-xl border border-red-100">
              <span className="text-xs font-bold text-red-700 uppercase tracking-wider">Emb. Prolongados ({'>'} 41 SDG)</span>
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
      </div>
    </div>
  );
}
