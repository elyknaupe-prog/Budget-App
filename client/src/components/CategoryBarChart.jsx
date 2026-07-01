import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { formatMoney } from '../lib/categories.js';

export default function CategoryBarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ left: 16, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tickFormatter={(v) => formatMoney(v)} fontSize={12} />
        <YAxis type="category" dataKey="category" width={100} fontSize={12} />
        <Tooltip formatter={(v) => formatMoney(v)} />
        <Bar dataKey="total" fill="#f43f5e" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
