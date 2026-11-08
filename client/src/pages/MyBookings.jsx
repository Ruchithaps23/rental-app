import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

const STATUS_STYLES = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-green-100 text-green-800",
  ACTIVE: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-gray-100 text-gray-700",
  CANCELLED: "bg-red-100 text-red-700",
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC", // our dates are stored as UTC midnight
  });
}

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/bookings/mine")
      .then(setBookings)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleCancel(id) {
    if (!window.confirm("Cancel this booking?")) return;
    try {
      const updated = await api(`/bookings/${id}/cancel`, { method: "PATCH" });
      // Update just this booking in the list, with no reload needed
      setBookings((list) => list.map((b) => (b.id === id ? { ...b, status: updated.status } : b)));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">My bookings</h1>

      {error && <p className="mb-4 rounded bg-red-100 p-3 text-red-700">{error}</p>}
      {loading && <p className="text-gray-500">Loading...</p>}
      {!loading && bookings.length === 0 && (
        <p className="text-gray-500">
          No bookings yet.{" "}
          <Link to="/" className="text-blue-600 hover:underline">
            Browse vehicles
          </Link>
        </p>
      )}

      <div className="space-y-4">
        {bookings.map((b) => (
          <div key={b.id} className="flex items-center justify-between rounded-lg bg-white p-5 shadow">
            <div>
              <h2 className="font-semibold text-gray-900">
                {b.vehicle.make} {b.vehicle.model}
              </h2>
              <p className="text-sm text-gray-500">
                {formatDate(b.startDate)} → {formatDate(b.endDate)}
              </p>
              <p className="mt-1 font-medium text-gray-800">
                ₹{Number(b.totalPrice).toLocaleString("en-IN")}
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[b.status]}`}>
                {b.status}
              </span>
              {["PENDING", "CONFIRMED"].includes(b.status) && (
                <button
                  onClick={() => handleCancel(b.id)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}