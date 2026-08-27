import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { resourceUsage } from '../../data/mockData';

const colors = ['#008C45', '#FF7A00', '#1976D2', '#A855F7'];

export default function ResourceUsageChart({ height = 240 }) {
  return <ResponsiveContainer width="100%" height={height}><PieChart><Pie data={resourceUsage} dataKey="available" nameKey="name" innerRadius="56%" outerRadius="82%" paddingAngle={4} stroke="none">{resourceUsage.map((entry, index) => <Cell key={entry.name} fill={colors[index]} />)}</Pie><Tooltip formatter={(value) => [`${value}%`, 'Available']} contentStyle={{ borderRadius: 14, border: '1px solid #eef0ee' }} /></PieChart></ResponsiveContainer>;
}
