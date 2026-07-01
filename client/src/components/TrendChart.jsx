import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { formatMoney } from '../lib/categories.js';

export default function TrendChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ left: 8, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" fontSize={12} />
        <YAxis tickFormatter={(v) => formatMoney(v)} fontSize={12} width={80} />
        <Tooltip formatter={(v) => formatMoney(v)} />
        <Legend />
        <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} name="Income" />
        <Line type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={2} name="Expenses" />
        <Line type="monotone" dataKey="surplus" stroke="#334155" strokeWidth={2} name="Surplus" />
      </LineChart>
    </ResponsiveContainer>
  );
}
