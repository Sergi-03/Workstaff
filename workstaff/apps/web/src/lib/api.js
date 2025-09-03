export const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const getAuth = () => {
  if (typeof window === "undefined") return { token: null, role: null, userId: null };
  return {
    token: localStorage.getItem("access_token"),
    role: localStorage.getItem("role"),
    userId: localStorage.getItem("userId"),
  };
};

export const apiFetch = async (path, { method = "GET", body, headers = {} } = {}) => {
  const { token } = getAuth();
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error || "Error en la petición";
    throw new Error(msg);
  }
  return data;
};
