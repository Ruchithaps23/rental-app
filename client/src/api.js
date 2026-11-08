const API_URL = "http://localhost:5000";

// One function for every request to our backend
export async function api(path, options = {}) {
  const token = localStorage.getItem("token"); // the login wristband (used from the next part)

  const res = await fetch(API_URL + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || "Something went wrong");
  return data;
}