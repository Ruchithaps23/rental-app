import { useEffect, useState } from "react";
import { api } from "../../api";

const emptyForm = {
  make: "",
  model: "",
  type: "Hatchback",
  seats: 5,
  transmission: "Manual",
  fuel: "Petrol",
  pricePerDay: "",
  imageUrl: "",
};

const inputClass = "mt-1 w-full rounded border border-gray-300 px-3 py-2";

export default function VehiclesTab() {
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null); // null = adding, a number = editing that vehicle
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      setVehicles(await api("/vehicles/admin/all"));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // One handler for every input: the input's "name" says which field to update
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function startEdit(v) {
    setEditingId(v.id);
    setForm({
      make: v.make,
      model: v.model,
      type: v.type,
      seats: v.seats,
      transmission: v.transmission,
      fuel: v.fuel,
      pricePerDay: Number(v.pricePerDay),
      imageUrl: v.imageUrl || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const body = JSON.stringify({ ...form, imageUrl: form.imageUrl || null });
    try {
      if (editingId) {
        await api(`/vehicles/${editingId}`, { method: "PATCH", body });
      } else {
        await api("/vehicles", { method: "POST", body });
      }
      cancelEdit();
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleStatus(v) {
    const status = v.status === "AVAILABLE" ? "MAINTENANCE" : "AVAILABLE";
    try {
      await api(`/vehicles/${v.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(v) {
    if (!window.confirm(`Delete ${v.make} ${v.model}?`)) return;
    try {
      await api(`/vehicles/${v.id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err.message); // e.g. "This vehicle has bookings..."
    }
  }

  if (loading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div>
      {error && <p className="mb-4 rounded bg-red-100 p-3 text-red-700">{error}</p>}

      <form onSubmit={handleSubmit} className="mb-8 rounded-lg bg-white p-5 shadow">
        <h3 className="mb-4 font-semibold text-gray-900">
          {editingId ? "Edit vehicle" : "Add a vehicle"}
        </h3>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm text-gray-600">
            Make
            <input name="make" required value={form.make} onChange={handleChange} className={inputClass} />
          </label>
          <label className="text-sm text-gray-600">
            Model
            <input name="model" required value={form.model} onChange={handleChange} className={inputClass} />
          </label>
          <label className="text-sm text-gray-600">
            Type
            <select name="type" value={form.type} onChange={handleChange} className={inputClass}>
              <option>Hatchback</option>
              <option>Sedan</option>
              <option>SUV</option>
            </select>
          </label>
          <label className="text-sm text-gray-600">
            Seats
            <input name="seats" type="number" min="1" required value={form.seats} onChange={handleChange} className={inputClass} />
          </label>
          <label className="text-sm text-gray-600">
            Transmission
            <select name="transmission" value={form.transmission} onChange={handleChange} className={inputClass}>
              <option>Manual</option>
              <option>Automatic</option>
            </select>
          </label>
          <label className="text-sm text-gray-600">
            Fuel
            <select name="fuel" value={form.fuel} onChange={handleChange} className={inputClass}>
              <option>Petrol</option>
              <option>Diesel</option>
              <option>Electric</option>
              <option>CNG</option>
            </select>
          </label>
          <label className="text-sm text-gray-600">
            Price per day (₹)
            <input name="pricePerDay" type="number" min="1" required value={form.pricePerDay} onChange={handleChange} className={inputClass} />
          </label>
          <label className="text-sm text-gray-600">
            Image URL (optional)
            <input name="imageUrl" value={form.imageUrl} onChange={handleChange} className={inputClass} />
          </label>
        </div>

        <div className="mt-5 flex gap-3">
          <button type="submit" className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">
            {editingId ? "Save changes" : "Add vehicle"}
          </button>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="rounded border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100">
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-gray-600">
            <tr>
              <th className="p-3">Vehicle</th>
              <th className="p-3">Details</th>
              <th className="p-3">Price/day</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.id} className="border-b last:border-0">
                <td className="p-3 font-medium text-gray-900">
                  {v.make} {v.model}
                </td>
                <td className="p-3 text-gray-500">
                  {v.type} · {v.seats} seats · {v.transmission} · {v.fuel}
                </td>
                <td className="p-3">₹{Number(v.pricePerDay).toLocaleString("en-IN")}</td>
                <td className="p-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      v.status === "AVAILABLE" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"
                    }`}
                  >
                    {v.status}
                  </span>
                </td>
                <td className="whitespace-nowrap p-3">
                  <button onClick={() => startEdit(v)} className="mr-3 text-blue-600 hover:underline">
                    Edit
                  </button>
                  <button onClick={() => toggleStatus(v)} className="mr-3 text-gray-600 hover:underline">
                    {v.status === "AVAILABLE" ? "Maintenance" : "Make available"}
                  </button>
                  <button onClick={() => handleDelete(v)} className="text-red-600 hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}