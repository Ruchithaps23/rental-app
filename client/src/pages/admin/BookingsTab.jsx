import { useEffect, useState } from "react";
import { api } from "../../api";

const STATUSES = ["PENDING", "CONFIRMED", "ACTIVE", "COMPLETED", "CANCELLED"];

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function BookingsTab() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/bookings/admin/all")
      .then(setBookings)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function changeStatus(id, status) {
    try {
      const updated = await api(`/bookings/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setBookings((list) => list.map((b) => (b.id === id ? { ...b, status: updated.status } : b)));
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div>
      {error && <p className="mb-4 rounded bg-red-100 p-3 text-red-700">{error}</p>}
      {bookings.length === 0 && <p className="text-gray-500">No bookings yet.</p>}

      {bookings.length > 0 && (
        <div className="overflow-x-auto rounded-lg bg-white shadow">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-gray-600">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Vehicle</th>
                <th className="p-3">Dates</th>
                <th className="p-3">Total</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-b last:border-0">
                  <td className="p-3 text-gray-500">{b.id}</td>
                  <td className="p-3">
                    <div className="font-medium text-gray-900">{b.user.name}</div>
                    <div className="text-gray-500">{b.user.email}</div>
                  </td>
                  <td className="p-3">
                    {b.vehicle.make} {b.vehicle.model}
                  </td>
                  <td className="whitespace-nowrap p-3">
                    {formatDate(b.startDate)} → {formatDate(b.endDate)}
                  </td>
                  <td className="p-3">₹{Number(b.totalPrice).toLocaleString("en-IN")}</td>
                  <td className="p-3">
                    <select
                      value={b.status}
                      onChange={(e) => changeStatus(b.id, e.target.value)}
                      className="rounded border border-gray-300 px-2 py-1"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}