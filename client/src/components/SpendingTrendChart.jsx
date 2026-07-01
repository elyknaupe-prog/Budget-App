import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function SpendingTrendChart({ data }) {
  if (!data.length) {
    return <p className="text-sm text-slate-500">Not enough history yet to show a trend.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
        <Legend />
        <Line type="monotone" dataKey="income" stroke="#0d9488" strokeWidth={2} />
        <Line type="monotone" dataKey="expenses" stroke="#db2777" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}
