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
  Cell,
} from "recharts";
import { useTheme } from "../../../context/ThemeContext";

const safeNumber = (value) => {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
};

const formatCurrency = (value) => {
  const n = safeNumber(value);
  if (n >= 10000000) return `Rs ${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `Rs ${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `Rs ${(n / 1000).toFixed(1)}k`;
  return `Rs ${n.toFixed(2)}`;
};

const getPalette = (isDark) =>
  isDark
    ? {
        cardBg: "#261e1a",
        cardBorder: "rgba(230, 210, 193, 0.2)",
        axis: "#b8aaa0",
        grid: "rgba(230, 210, 193, 0.16)",
        bar: "#e88c6f",
        barHover: "#f4a58d",
        line: "#f6c3b2",
        areaStart: "rgba(232, 140, 111, 0.38)",
        areaEnd: "rgba(232, 140, 111, 0.03)",
        tooltipBg: "#1d1714",
        tooltipText: "#f4ede8",
        tooltipBorder: "rgba(230, 210, 193, 0.24)",
      }
    : {
        cardBg: "#fffdf9",
        cardBorder: "rgba(95, 75, 55, 0.24)",
        axis: "#6d6158",
        grid: "rgba(95, 75, 55, 0.14)",
        bar: "#b85234",
        barHover: "#d27758",
        line: "#91361f",
        areaStart: "rgba(184, 82, 52, 0.26)",
        areaEnd: "rgba(184, 82, 52, 0.02)",
        tooltipBg: "#fffaf4",
        tooltipText: "#1f1915",
        tooltipBorder: "rgba(95, 75, 55, 0.26)",
      };

export default function RevenueChart({
  data = [],
  height = 320,
  showSummary = true,
  onBarClick = null,
}) {
  const uid = useId();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const palette = useMemo(() => getPalette(isDark), [isDark]);
  const [activeIndex, setActiveIndex] = useState(null);

  const enrichedData = useMemo(() => {
    return data.map((point, index) => {
      const revenue = safeNumber(point.Revenue);
      const previous = safeNumber(data[index - 1]?.Revenue);
      const delta = revenue - previous;
      const pct = previous ? (delta / previous) * 100 : null;
      return {
        ...point,
        Revenue: revenue,
        delta,
        pct,
      };
    });
  }, [data]);

  const summary = useMemo(() => {
    const total = enrichedData.reduce((sum, point) => sum + safeNumber(point.Revenue), 0);
    const avg = enrichedData.length ? total / enrichedData.length : 0;
    const latest = safeNumber(enrichedData[enrichedData.length - 1]?.Revenue);
    const prev = safeNumber(enrichedData[enrichedData.length - 2]?.Revenue);
    const change = latest - prev;
    const pct = prev ? (change / prev) * 100 : null;

    return {
      total,
      avg,
      latest,
      change,
      pct,
    };
  }, [enrichedData]);

  const maxRevenue = useMemo(() => {
    if (!enrichedData.length) return 0;
    return Math.max(...enrichedData.map((point) => safeNumber(point.Revenue)));
  }, [enrichedData]);

  const TooltipContent = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;

    const item = payload[0].payload;

    return (
      <div
        className="rounded-xl border px-3 py-2 text-xs"
        style={{
          backgroundColor: palette.tooltipBg,
          color: palette.tooltipText,
          borderColor: palette.tooltipBorder,
        }}
      >
        <p className="font-semibold">{label}</p>
        <p className="mt-1">Revenue: {formatCurrency(item.Revenue)}</p>
        {item.pct == null ? null : (
          <p className="mt-1">
            Change: {item.pct >= 0 ? "+" : ""}
            {item.pct.toFixed(1)}%
          </p>
        )}
      </div>
    );
  };

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)] p-8 text-center text-sm text-[var(--nm-muted)]">
        No revenue data to display yet.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)] p-4 sm:p-5">
      {showSummary ? (
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--nm-muted)]">Total</p>
            <p className="mt-1 text-lg font-semibold">{formatCurrency(summary.total)}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--nm-muted)]">Average</p>
            <p className="mt-1 text-lg font-semibold">{formatCurrency(summary.avg)}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--nm-muted)]">Latest</p>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-lg font-semibold">{formatCurrency(summary.latest)}</p>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  summary.pct == null
                    ? "bg-[var(--nm-bg-elevated)] text-[var(--nm-muted)]"
                    : summary.pct >= 0
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700"
                }`}
              >
                {summary.pct == null ? "-" : `${summary.pct >= 0 ? "+" : ""}${summary.pct.toFixed(1)}%`}
              </span>
            </div>
          </div>
        </div>
      ) : null}

      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={enrichedData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <defs>
              <linearGradient id={`area-${uid}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={palette.areaStart} />
                <stop offset="100%" stopColor={palette.areaEnd} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="4 6" vertical={false} stroke={palette.grid} />

            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              stroke={palette.axis}
              tick={{ fontSize: 12 }}
              minTickGap={10}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              stroke={palette.axis}
              width={72}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const n = safeNumber(value);
                if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
                if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
                return `${n}`;
              }}
            />

            <Tooltip content={<TooltipContent />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />

            <Area
              type="monotone"
              dataKey="Revenue"
              stroke="none"
              fill={`url(#area-${uid})`}
              isAnimationActive
              animationDuration={700}
            />

            <Bar
              dataKey="Revenue"
              radius={[10, 10, 4, 4]}
              barSize={26}
              onMouseOver={(_, index) => setActiveIndex(index)}
              onMouseOut={() => setActiveIndex(null)}
              onClick={(point, index) => {
                if (typeof onBarClick === "function") onBarClick(point, index);
              }}
            >
              {enrichedData.map((point, index) => (
                <Cell
                  key={`${point.name}-${index}`}
                  fill={index === activeIndex ? palette.barHover : palette.bar}
                  opacity={index === activeIndex ? 1 : 0.88}
                />
              ))}
            </Bar>

            <Line
              type="monotone"
              dataKey="Revenue"
              stroke={palette.line}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive
              animationDuration={800}
            />

            {maxRevenue > 0 ? (
              <ReferenceLine
                y={maxRevenue}
                stroke={palette.line}
                strokeDasharray="5 6"
                label={{
                  position: "right",
                  value: `Peak ${formatCurrency(maxRevenue)}`,
                  fill: palette.axis,
                  fontSize: 11,
                }}
              />
            ) : null}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
