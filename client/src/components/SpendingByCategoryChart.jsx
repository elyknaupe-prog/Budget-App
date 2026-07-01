import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0d9488', '#0891b2', '#7c3aed', '#db2777', '#ea580c', '#65a30d', '#4f46e5', '#ca8a04'];

export default function SpendingByCategoryChart({ data }) {
  if (!data.length) {
    return <p className="text-sm text-slate-500">No expenses logged this month yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="amount" nameKey="category" outerRadius={90} label={(entry) => entry.category}>
          {data.map((entry, index) => (
            <Cell key={entry.category} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
