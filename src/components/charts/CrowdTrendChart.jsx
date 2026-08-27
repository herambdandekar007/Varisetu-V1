import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useApp } from '../../context/AppContext';

export default function CrowdTrendChart({ height = 250, compact = false }) {
  const { crowdTrend, simulation, activeDemo } = useApp();

  const chartData = activeDemo === 'crowd-simulation' && simulation.history && simulation.history.length >= 2
    ? [
        ...crowdTrend.slice(0, Math.max(0, crowdTrend.length - simulation.history.length)),
        ...simulation.history,
      ]
    : crowdTrend;

  return <ResponsiveContainer width="100%" height={height}><AreaChart data={chartData} margin={{ top: 5, left: compact ? -25 : -10, right: 8, bottom: 0 }}><defs><linearGradient id="crowdGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#FF7A00" stopOpacity={0.35} /><stop offset="100%" stopColor="#FF7A00" stopOpacity={0.01} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#edf0ee" /><XAxis dataKey="time" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} dy={8} /><YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} tickFormatter={(value) => `${value}k`} /><Tooltip contentStyle={{ borderRadius: 14, border: '1px solid #eef0ee', boxShadow: '0 10px 24px rgba(21,32,26,.1)' }} labelStyle={{ fontWeight: 700 }} formatter={(value) => [`${value}k pilgrims`, 'Crowd volume']} /><Area type="monotone" dataKey="pilgrims" stroke="#FF7A00" strokeWidth={3} fill="url(#crowdGradient)" /></AreaChart></ResponsiveContainer>;
}
