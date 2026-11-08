import { useEffect, useState } from "react";
import { api } from "../api";
import BookingsTab from "./admin/BookingsTab";
import VehiclesTab from "./admin/VehiclesTab";
import CustomersTab from "./admin/CustomersTab";

const TABS = [
  { id: "bookings", label: "Bookings" },
  { id: "vehicles", label: "Vehicles" },
  { id: "customers", label: "Customers" },
];

export default function Admin() {
  const [tab, setTab] = useState("bookings");
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api("/admin/stats").then(setStats).catch(() => {});
  }, []);

  const cards = stats && [
    { label: "Revenue", value: `₹${stats.revenue.toLocaleString("en-IN")}` },
    { label: "Pending bookings", value: stats.pending },
    { label: "Vehicles", value: stats.vehicles },
    { label: "Customers", value: stats.customers },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Admin dashboard</h1>

      {cards && (
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {cards.map((c) => (
            <div key={c.label} className="rounded-lg bg-white p-4 shadow">
              <p className="text-sm text-gray-500">{c.label}</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{c.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mb-6 flex gap-2 border-b">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium ${
              tab === t.id
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "bookings" && <BookingsTab />}
      {tab === "vehicles" && <VehiclesTab />}
      {tab === "customers" && <CustomersTab />}
    </main>
  );
}