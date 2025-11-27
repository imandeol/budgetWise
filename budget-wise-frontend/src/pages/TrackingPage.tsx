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
      <p>Total expenditure (your share): {total}</p>

      <section style={{ marginTop: 24 }}>
        <h2>By category</h2>
        {categories.length === 0 ? (
          <p>No spending data.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {categories.map((c) => {
              const width = max ? (c.total / max) * 100 : 0;
              return (
                <div key={c.category}>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span>{c.category || "Uncategorized"}</span>
                    <span>{c.total.toFixed(2)}</span>
                  </div>
                  <div
                    style={{ background: "#eee", height: 10, borderRadius: 4 }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${width}%`,
                        background: "#4f46e5",
                        borderRadius: 4,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
