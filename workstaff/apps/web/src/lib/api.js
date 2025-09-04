export const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const getAuth = () => {
  if (typeof window === "undefined")
    return { token: null, role: null, userId: null };
  return {
    token: localStorage.getItem("access_token"),
    role: localStorage.getItem("role"),
    userId: localStorage.getItem("userId"),
  };
};

export const apiFetch = async (
  path,
  { method = "GET", body, headers = {} } = {}
) => {
  const { token } = getAuth();
  const options = {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  };

  if (body instanceof FormData) {
    options.body = body;
  } else if (body) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`${API_URL}${path}`, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error || "Error en la petición";
    throw new Error(msg);
  }
  return data;
};