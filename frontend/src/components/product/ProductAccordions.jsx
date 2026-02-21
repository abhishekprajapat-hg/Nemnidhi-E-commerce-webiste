import React, { useMemo } from "react";
import Accordion from "../ui/Accordion";

export default function ProductAccordions({ sizeChart }) {
  const sizeChartRows = useMemo(() => {
    if (!Array.isArray(sizeChart?.rows)) return [];

    return sizeChart.rows
      .map((row) => ({
        size: String(row?.size || "").trim(),
        chest: String(row?.chest || "").trim(),
        waist: String(row?.waist || "").trim(),
        hip: String(row?.hip || "").trim(),
        length: String(row?.length || "").trim(),
      }))
      .filter((row) => Object.values(row).some(Boolean));
  }, [sizeChart]);

  const sizeChartUnit = String(sizeChart?.unit || "in").trim() || "in";
  const sizeChartNote = String(sizeChart?.note || "").trim();

  if (sizeChartRows.length === 0) return null;

  return (
    <div className="space-y-3 pt-1">
      {sizeChartRows.length > 0 ? (
        <Accordion title="Size Chart">
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--nm-muted)]">
              Measurements in {sizeChartUnit}
            </div>

            <div className="overflow-x-auto rounded-xl border border-[var(--nm-border)]">
              <table className="min-w-full border-collapse text-left text-xs sm:text-sm">
                <thead className="bg-[var(--nm-card)] text-[var(--nm-text)]">
                  <tr>
                    <th className="border-b border-[var(--nm-border)] px-3 py-2 font-semibold">Size</th>
                    <th className="border-b border-[var(--nm-border)] px-3 py-2 font-semibold">Chest</th>
                    <th className="border-b border-[var(--nm-border)] px-3 py-2 font-semibold">Waist</th>
                    <th className="border-b border-[var(--nm-border)] px-3 py-2 font-semibold">Hip</th>
                    <th className="border-b border-[var(--nm-border)] px-3 py-2 font-semibold">Length</th>
                  </tr>
                </thead>
                <tbody>
                  {sizeChartRows.map((row, index) => (
                    <tr key={`size-chart-${row.size || "row"}-${index}`} className="odd:bg-[var(--nm-surface)]">
                      <td className="border-b border-[var(--nm-border)] px-3 py-2 font-semibold text-[var(--nm-text)]">
                        {row.size || "-"}
                      </td>
                      <td className="border-b border-[var(--nm-border)] px-3 py-2 text-[var(--nm-text)]">{row.chest || "-"}</td>
                      <td className="border-b border-[var(--nm-border)] px-3 py-2 text-[var(--nm-text)]">{row.waist || "-"}</td>
                      <td className="border-b border-[var(--nm-border)] px-3 py-2 text-[var(--nm-text)]">{row.hip || "-"}</td>
                      <td className="border-b border-[var(--nm-border)] px-3 py-2 text-[var(--nm-text)]">{row.length || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {sizeChartNote ? (
              <p className="text-xs leading-5 text-[var(--nm-muted)]">{sizeChartNote}</p>
            ) : null}
          </div>
        </Accordion>
      ) : null}
    </div>
  );
}
