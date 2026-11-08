import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

const TYPES = ["All", "Hatchback", "Sedan", "SUV"];

function CarPlaceholder() {
  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16 text-blue-600/25" fill="currentColor" fillRule="evenodd">
      <path d="M8 38l6-14c1-3 4-5 7-5h22c3 0 6 2 7 5l6 14v10h-6v-4H14v4H8V38zm10-2h28l-4-10H22l-4 10z" />
    </svg>
  );
}

export default function Home() {
  const [vehicles, setVehicles] = useState([]);
  const [type, setType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (from && to) {
      params.set("from", from);
      params.set("to", to);
    }

    setLoading(true);
    api(`/vehicles?${params}`)
      .then((data) => {
        setVehicles(data);
        setError("");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [type, from, to]);

  const today = new Date().toISOString().slice(0, 10);
  const hasFilters = type || from || to;
  const dateInput = "mt-1 rounded border border-gray-300 px-3 py-2 text-gray-900";

  return (
    <>
      {/* Hero: the headline and the search are the first thing people use */}
      <section className="bg-blue-600 pb-28 pt-8 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <h1 className="max-w-2xl text-4xl font-extrabold leading-tight sm:text-5xl">
            Pick your dates. We&rsquo;ll show you what&rsquo;s free.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-white/75">
            Hatchbacks, sedans and SUVs, priced per day. Book in a minute, and cancel from My bookings.
          </p>
        </div>
      </section>

      <main className="mx-auto -mt-16 max-w-6xl px-4 pb-14">
        {/* Search bar overlaps the hero */}
        <div className="flex flex-wrap items-end gap-x-6 gap-y-4 rounded-xl bg-white p-5 shadow-lg">
          <div>
            <p className="mb-1 text-sm text-gray-600">Vehicle type</p>
            <div className="flex gap-1 rounded-lg bg-gray-50 p-1">
              {TYPES.map((t) => {
                const active = (t === "All" && !type) || t === type;
                return (
                  <button
                    key={t}
                    onClick={() => setType(t === "All" ? "" : t)}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                      active ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-white"
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex flex-col text-sm text-gray-600">
            Pick-up date
            <input type="date" min={today} value={from} onChange={(e) => setFrom(e.target.value)} className={dateInput} />
          </label>

          <label className="flex flex-col text-sm text-gray-600">
            Return date
            <input type="date" min={from || today} value={to} onChange={(e) => setTo(e.target.value)} className={dateInput} />
          </label>

          {hasFilters && (
            <button
              onClick={() => {
                setType("");
                setFrom("");
                setTo("");
              }}
              className="pb-2 text-sm font-medium text-blue-600 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {error && <p className="mt-6 rounded bg-red-100 p-3 text-red-700">{error}</p>}
        {loading && <p className="mt-8 text-gray-500">Loading vehicles...</p>}

        {!loading && !error && (
          <p className="mb-5 mt-8 font-medium text-gray-700">
            {vehicles.length === 0
              ? "No vehicles are free for these filters. Try different dates or another type."
              : `${vehicles.length} ${vehicles.length === 1 ? "vehicle" : "vehicles"} available`}
          </p>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((v) => (
            <Link
              key={v.id}
              to={`/vehicles/${v.id}${from && to ? `?from=${from}&to=${to}` : ""}`}
              className="group block overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5 hover:shadow-lg"
            >
              <div className="relative flex h-44 items-center justify-center bg-gray-50">
                {v.imageUrl ? (
                  <img
                    src={v.imageUrl}
                    alt={`${v.make} ${v.model}`}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <CarPlaceholder />
                )}
                {/* Price styled like a number plate */}
                <span className="absolute bottom-3 left-3 rounded border-2 border-blue-600 bg-signal px-3 py-1 font-display text-lg font-extrabold text-blue-600">
                  &#8377;{Number(v.pricePerDay).toLocaleString("en-IN")}
                  <span className="text-xs font-semibold"> /day</span>
                </span>
              </div>

              <div className="p-5">
                <h2 className="text-xl font-bold text-gray-900">
                  {v.make} {v.model}
                </h2>
                <p className="text-sm text-gray-500">{v.type}</p>

                <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-gray-700">
                  <span className="rounded-full bg-gray-50 px-3 py-1">{v.seats} seats</span>
                  <span className="rounded-full bg-gray-50 px-3 py-1">{v.transmission}</span>
                  <span className="rounded-full bg-gray-50 px-3 py-1">{v.fuel}</span>
                </div>

                <p className="mt-5 text-sm font-bold text-blue-600 group-hover:underline">Book this car</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}