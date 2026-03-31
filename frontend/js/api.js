const API_BASE_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:8000/api"
    : "https://titanblockchaincapital-xo4q.onrender.com/api";

function getStoredToken() {
  return (
    localStorage.getItem("token") ||
    sessionStorage.getItem("token") ||
    ""
  );
}

async function apiRequest(endpoint, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = getStoredToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const isFormData = options.body instanceof FormData;
  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    credentials: "include",
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  let data;

  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const message =
      typeof data === "object" && data?.message
        ? data.message
        : typeof data === "string" && data.trim()
          ? data
          : "Something went wrong";
    throw new Error(message);
  }

  return data;
}

window.API = {
  get(endpoint) {
    return apiRequest(endpoint, { method: "GET" });
  },

  post(endpoint, body = {}) {
    return apiRequest(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  put(endpoint, body = {}) {
    return apiRequest(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  patch(endpoint, body = {}) {
    return apiRequest(endpoint, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },

  delete(endpoint) {
    return apiRequest(endpoint, { method: "DELETE" });
  },

  postForm(endpoint, formData) {
    return apiRequest(endpoint, {
      method: "POST",
      body: formData,
    });
  },

  putForm(endpoint, formData) {
    return apiRequest(endpoint, {
      method: "PUT",
      body: formData,
    });
  },
};