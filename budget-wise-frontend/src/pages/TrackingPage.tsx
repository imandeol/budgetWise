import { useEffect, useMemo, useState } from "react";
import { fetchTracking } from "../api/summary";
import type { CategorySpend } from "../types";

export default function TrackingPage() {
  const [categories, setCategories] = useState<CategorySpend[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    (async () => {
      const data = await fetchTracking();
      setCategories(data.categories);
      setTotal(data.total);
    })();
  }, []);

  const max = useMemo(
    () => (categories.length ? Math.max(...categories.map((c) => c.total)) : 0),
    [categories]
  );

  return (
    <div>
      <h1>Spending tracker</h1>
      <p className="text-muted mt-1">
        See how your share of expenses is distributed across categories.
      </p>

      <div className="card mt-3">
        <h2>Overview</h2>
        <p className="text-muted mt-1">
          Total expenditure (your share): <strong>{total}</strong>
        </p>
      </div>

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
              const width = max ? (c.total / max) * 100 : 0;
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
                    <span>{c.total}</span>
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
    </div>
  );
}
