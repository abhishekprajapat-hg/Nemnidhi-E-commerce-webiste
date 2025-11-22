// src/components/admin/dashboard/RevenueChartEnhanced.jsx
import React, { useId, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Area,
  Line,
  ReferenceLine,
  Legend,
} from "recharts";
import { useTheme } from "../../../context/ThemeContext";

/**
 * Enhanced Revenue Chart
 * - Composed chart: Bar + Area + Line overlay
 * - Animated bars and area
 * - Gradient fills tuned for dark/light
 * - Custom tooltip with delta and percent change
 * - Hover highlight + clickable bars (onBarClick)
 * - Small summary header (total, avg, growth)
 *
 * Props:
 *  - data: [{ name: '01 Nov', Revenue: 12345 }, ...]
 *  - height: number (optional, default 320)
 *  - showSummary: boolean (default true)
 *  - onBarClick: function(record, index) optional
 */
export default function RevenueChart({
  data = [],
  height = 320,
  showSummary = true,
  onBarClick = null,
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const uid = useId(); // unique ids for gradients

  // normalize safe numbers
  const safeNum = (v) => {
    const n = Number(v || 0);
    return Number.isFinite(n) ? n : 0;
  };

  // derived summary metrics
  const summary = useMemo(() => {
    const total = data.reduce((s, d) => s + safeNum(d.Revenue), 0);
    const avg = data.length ? total / data.length : 0;
    const last = safeNum(data[data.length - 1]?.Revenue);
    const prev = safeNum(data[data.length - 2]?.Revenue);
    const delta = last - prev;
    const pct = prev ? (delta / prev) * 100 : null;
    return { total, avg, last, delta, pct };
  }, [data]);

  // enrich data with diff + percent for tooltip
  const enriched = useMemo(() => {
    return data.map((d, i) => {
      const prev = safeNum(data[i - 1]?.Revenue);
      const rev = safeNum(d.Revenue);
      const diff = rev - prev;
      const percent = prev ? (diff / prev) * 100 : null;
      return { ...d, Revenue: rev, diff, percent };
    });
  }, [data]);

  // small formatter for ₹ with compact units
  const formatCurrency = (num) => {
    const n = safeNum(num);
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
    return `₹${n.toLocaleString("en-IN")}`;
  };

  // hover state (highlight)
  const [activeIndex, setActiveIndex] = useState(null);

  // colors
  const barBase = isDark ? "#f4f4f5" : "#0f172a"; // light bar on dark / dark bar on light
  const barHover = isDark ? "#fde68a" : "#fb923c";
  const areaStart = isDark ? "rgba(245,245,245,0.12)" : "rgba(17,24,39,0.08)";
  const areaEnd = isDark ? "rgba(245,245,245,0.02)" : "rgba(17,24,39,0.01)";
  const lineColor = isDark ? "#a3e635" : "#10b981";

  // custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    const item = payload[0].payload;
    return (
      <div
        className={`rounded-lg p-3 shadow-md text-sm border ${
          isDark ? "bg-zinc-800 border-zinc-700 text-zinc-100" : "bg-white border-gray-200 text-gray-800"
        }`}
      >
        <div className="font-semibold mb-1">{label}</div>
        <div>Revenue: <span className="font-medium">{formatCurrency(item.Revenue)}</span></div>
        {item.percent !== null && (
          <div className={`mt-1 font-medium ${item.percent >= 0 ? "text-green-500" : "text-red-500"}`}>
            {item.percent >= 0 ? "▲" : "▼"} {Math.abs(item.percent).toFixed(1)}%
          </div>
        )}
        {/* small hint */}
        <div className="mt-2 text-xs text-gray-400">
          Click bar to open details
        </div>
      </div>
    );
  };

  // empty state
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="rounded-xl border bg-white dark:bg-zinc-800 dark:border-zinc-700 p-6 shadow-sm text-center">
        <div className="text-sm text-gray-500 dark:text-gray-400">No revenue data to display yet.</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white dark:bg-zinc-800 dark:border-zinc-700 p-4 shadow-sm">
      {showSummary && (
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Total Revenue</div>
            <div className="text-2xl font-semibold dark:text-white">{formatCurrency(summary.total)}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Average: {formatCurrency(summary.avg)}</div>
          </div>

          <div className="text-right">
            <div className="text-xs text-gray-500 dark:text-gray-400">Latest</div>
            <div className="flex items-center gap-2">
              <div className="text-lg font-semibold dark:text-white">{formatCurrency(summary.last)}</div>
              <div
                className={`text-sm px-2 py-0.5 rounded ${summary.pct == null ? "bg-gray-100 text-gray-600 dark:bg-zinc-700 dark:text-gray-300" : summary.pct >= 0 ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"}`}
              >
                {summary.pct == null ? "—" : `${summary.pct >= 0 ? "+" : ""}${summary.pct.toFixed(1)}%`}
              </div>
            </div>

            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Last {data.length} points
            </div>
          </div>
        </div>
      )}

      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={enriched}
            margin={{ top: 8, right: 24, left: 0, bottom: 8 }}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <defs>
              <linearGradient id={`areaGrad-${uid}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={areaStart} stopOpacity={1} />
                <stop offset="100%" stopColor={areaEnd} stopOpacity={1} />
              </linearGradient>

              <linearGradient id={`barGrad-${uid}`} x1="0" x2="0">
                <stop offset="0%" stopColor={barBase} stopOpacity={1} />
                <stop offset="100%" stopColor={barHover} stopOpacity={1} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 6" vertical={false} stroke={isDark ? "#2c2c2c" : "#f3f4f6"} />

            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              stroke={isDark ? "#c4c4c4" : "#6b7280"}
              minTickGap={8}
              tick={{ fontSize: 12 }}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              stroke={isDark ? "#c4c4c4" : "#6b7280"}
              tickFormatter={(v) => {
                // compact format for ticks
                const n = safeNum(v);
                if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
                if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
                return `₹${n}`;
              }}
              width={84}
            />

            <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }} />

            <Area
              type="monotone"
              dataKey="Revenue"
              fill={`url(#areaGrad-${uid})`}
              stroke="none"
              isAnimationActive={true}
              animationDuration={900}
              animationEasing="ease-out"
            />

            <Bar
              dataKey="Revenue"
              barSize={34}
              radius={[8, 8, 4, 4]}
              onMouseOver={(_, index) => setActiveIndex(index)}
              onMouseOut={() => setActiveIndex(null)}
              onClick={(d, idx) => {
                if (typeof onBarClick === "function") onBarClick(d, idx);
              }}
            >
              {enriched.map((entry, idx) => {
                const isActive = idx === activeIndex;
                const fill = isActive ? barHover : `url(#barGrad-${uid})`;
                const opacity = isActive ? 1 : 0.95;
                return <cell key={`c-${idx}`} fill={fill} opacity={opacity} />;
              })}
            </Bar>

            <Line
              type="monotone"
              dataKey="Revenue"
              stroke={lineColor}
              strokeWidth={2}
              dot={{ r: 2 }}
              activeDot={{ r: 6 }}
              animationDuration={900}
              animationEasing="ease-out"
            />

            {/* Reference line for maximum day */}
            {(() => {
              const max = Math.max(...enriched.map((i) => safeNum(i.Revenue)));
              if (!Number.isFinite(max) || max === 0) return null;
              return <ReferenceLine y={max} stroke={isDark ? "#52525b" : "#eab308"} strokeDasharray="4 6" label={{ position: "right", value: `Peak ${formatCurrency(max)}`, fill: isDark ? "#d4d4d8" : "#92400e", fontSize: 11 }} />;
            })()}

            <Legend verticalAlign="top" wrapperStyle={{ paddingLeft: 8, paddingTop: 4, color: isDark ? "#d4d4d8" : "#374151" }} />
          </ComposedChart>
        </ResponsiveContainer>

      </div>
    </div>
  );
}
