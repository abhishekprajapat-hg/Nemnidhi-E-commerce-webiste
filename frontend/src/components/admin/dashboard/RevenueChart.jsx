import React from "react";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from "recharts";
import { useTheme } from "../../../context/ThemeContext";

export default function RevenueChart({ data = [] }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#3f3f46" : "#e0e0e0"} vertical={false} />
          <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} stroke={isDark ? "#a1a1aa" : "#6b7280"} />
          <YAxis fontSize={12} tickLine={false} axisLine={false} stroke={isDark ? "#a1a1aa" : "#6b7280"} tickFormatter={(val) => `₹${val/1000}k`} />
          <Tooltip
            cursor={{ fill: isDark ? '#3f3f46' : '#fafafa' }}
            contentStyle={{
              borderRadius: '8px',
              border: `1px solid ${isDark ? '#3f3f46' : '#e0e0e0'}`,
              backgroundColor: isDark ? '#27272a' : '#ffffff'
            }}
            formatter={(val) => [`₹${Number(val).toFixed(2)}`, 'Revenue']}
          />
          <Bar dataKey="Revenue" fill={isDark ? "#f4f4f5" : "#111827"} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
