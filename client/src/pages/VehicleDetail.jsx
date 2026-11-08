import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export default function VehicleDetail() {
  const { id } = useParams(); // the :id from the URL
  const [searchParams] = useSearchParams(); // the ?from=...&to=... part
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [vehicle, setVehicle] = useState(null);
  const [from, setFrom] = useState(searchParams.get("from") || "");
  const [to, setTo] = useState(searchParams.get("to") || "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api(`/vehicles/${id}`)
      .then(setVehicle)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="p-6 text-gray-500">Loading...</p>;
  if (!vehicle) return <p className="p-6 text-red-600">{error || "Vehicle not found"}</p>;

  // Live price calculation
  const today = new Date().toISOString().slice(0, 10);
  const datesValid = from && to && new Date(to) > new Date(from);
  const days = datesValid ? Math.ceil((new Date(to) - new Date(from)) / MS_PER_DAY) : 0;
  const total = days * Number(vehicle.pricePerDay);

  async function handleBook() {
    // Not logged in? Go to login, then come back here
    if (!user) {
      navigate("/login", { state: { from: location.pathname + location.search } });
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      await api("/bookings", {
        method: "POST",
        body: JSON.stringify({ vehicleId: vehicle.id, startDate: from, endDate: to }),
      });
      navigate("/bookings");
    } catch (err) {
      setError(err.message); // e.g. "This vehicle is already booked for those dates"
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="rounded-lg bg-white p-6 shadow">
        {vehicle.imageUrl && (
  <img
    src={vehicle.imageUrl}
    alt={`${vehicle.make} ${vehicle.model}`}
    className="mb-6 h-64 w-full rounded object-cover"
  />
)}
        <h1 className="text-2xl font-bold text-gray-900">
          {vehicle.make} {vehicle.model}
        </h1>
        <p className="mt-1 text-gray-500">
          {vehicle.type} · {vehicle.seats} seats · {vehicle.transmission} · {vehicle.fuel}
        </p>
        <p className="mt-4 text-2xl font-bold text-blue-600">
          ₹{Number(vehicle.pricePerDay).toLocaleString("en-IN")}
          <span className="text-sm font-normal text-gray-500"> / day</span>
        </p>

        <div className="mt-6 flex flex-wrap gap-4">
          <label className="flex flex-col text-sm text-gray-600">
            Pick-up date
            <input
              type="date"
              min={today}
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-1 rounded border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="flex flex-col text-sm text-gray-600">
            Return date
            <input
              type="date"
              min={from || today}
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1 rounded border border-gray-300 px-3 py-2"
            />
          </label>
        </div>

        {datesValid && (
          <div className="mt-6 rounded bg-gray-50 p-4 text-gray-700">
            {days} {days === 1 ? "day" : "days"} × ₹{Number(vehicle.pricePerDay).toLocaleString("en-IN")} ={" "}
            <span className="text-lg font-bold text-gray-900">₹{total.toLocaleString("en-IN")}</span>
          </div>
        )}

        {error && <p className="mt-4 rounded bg-red-100 p-3 text-sm text-red-700">{error}</p>}

        <button
          onClick={handleBook}
          disabled={!datesValid || submitting}
          className="mt-6 w-full rounded bg-blue-600 py-2.5 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Booking..." : user ? "Book now" : "Log in to book"}
        </button>
      </div>
    </main>
  );
}