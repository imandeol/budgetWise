import { useEffect, useMemo, useState } from "react";
import { fetchTracking } from "../api/summary";
import type { CategorySpend } from "../types";

const YEAR_OPTIONS = [2020, 2021, 2022, 2023, 2024, 2025];

type MonthlySpend = {
  year: number;
  month: number; // 1–12
  total: number;
};

export default function TrackingPage() {
  const [categories, setCategories] = useState<CategorySpend[]>([]);
  const [total, setTotal] = useState(0); // total expenditure (your share)
  const [spentByYou, setSpentByYou] = useState(0); // total you actually paid

  const [monthly, setMonthly] = useState<MonthlySpend[]>([]);

  const [selectedYear, setSelectedYear] = useState<number>(() => {
    const currentYear = new Date().getFullYear();
    return YEAR_OPTIONS.includes(currentYear)
      ? currentYear
      : YEAR_OPTIONS[YEAR_OPTIONS.length - 1];
  });

  useEffect(() => {
    (async () => {
      const data = await fetchTracking();
      setCategories(data.categories);
      setTotal(data.total);

      // If backend provides this, use it; otherwise fall back to total.
      setSpentByYou(data.spentByYou ?? data.total);

      // Monthly array: [{ year, month, total }]
      setMonthly(data.monthly ?? []);
    })();
  }, []);

  // For category bars
  const maxCategory = useMemo(
    () => (categories.length ? Math.max(...categories.map((c) => c.total)) : 0),
    [categories]
  );

  // Filter monthly for selected year & ignore zero totals
  const monthlyForYear = useMemo(
    () => monthly.filter((m) => m.year === selectedYear && m.total > 0),
    [monthly, selectedYear]
  );

  const maxMonthly = useMemo(
    () =>
      monthlyForYear.length
        ? Math.max(...monthlyForYear.map((m) => m.total))
        : 0,
    [monthlyForYear]
  );

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return (
    <div>
      <h1>Spending tracker</h1>
      <p className="text-muted mt-1">
        See how your share of expenses is distributed across categories and
        time.
      </p>

      {/* Overview card */}
      <div className="card mt-3">
        <h2>Overview</h2>

        <div
          style={{
            marginTop: "0.75rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.3rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.95rem",
            }}
          >
            <span className="text-muted">Total money spent by you</span>
            <strong>{"$ " + spentByYou}</strong>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.95rem",
            }}
          >
            <span className="text-muted">Total expenditure (your share)</span>
            <strong>{"$ " + total}</strong>
          </div>
        </div>
      </div>

      {/* By category card */}
      <div className="card mt-3">
        <h2>By category</h2>
        {categories.length === 0 ? (
          <p className="text-muted mt-1">No spending data yet.</p>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              marginTop: "0.75rem",
            }}
          >
            {categories.map((c) => {
              const width = maxCategory ? (c.total / maxCategory) * 100 : 0;
              return (
                <div key={c.category || "Uncategorized"}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "0.2rem",
                    }}
                  >
                    <span>{c.category || "Uncategorized"}</span>
                    <span>{"$ " + c.total}</span>
                  </div>
                  <div
                    style={{
                      background: "#e5e7eb",
                      height: 10,
                      borderRadius: 4,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${width}%`,
                        background: "#2563eb",
                        borderRadius: 4,
                        transition: "width 0.2s ease-out",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* By month card */}
      <div className="card mt-3">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <h2 style={{ margin: 0 }}>By month</h2>

          <div>
            <label className="text-muted" style={{ fontSize: "0.85rem" }}>
              Year{" "}
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                style={{ marginLeft: "0.25rem" }}
              >
                {YEAR_OPTIONS.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {monthlyForYear.length === 0 ? (
          <p className="text-muted mt-1">
            You don&apos;t have any expense in this year.
          </p>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              marginTop: "0.75rem",
            }}
          >
            {monthlyForYear.map((m) => {
              const width = maxMonthly ? (m.total / maxMonthly) * 100 : 0;
              const label = monthNames[m.month - 1] ?? `Month ${m.month}`;
              return (
                <div key={`${m.year}-${m.month}`}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "0.2rem",
                    }}
                  >
                    <span>{label}</span>
                    <span>{"$ " + m.total}</span>
                  </div>
                  <div
                    style={{
                      background: "#e5e7eb",
                      height: 10,
                      borderRadius: 4,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${width}%`,
                        background: "#10b981", // green-ish for monthly
                        borderRadius: 4,
                        transition: "width 0.2s ease-out",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
