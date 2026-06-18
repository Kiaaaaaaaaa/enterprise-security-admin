const LOCAL_URL = "http://localhost:8080/api/admin";
const REMOTE_URL = "https://admin-api-server.onrender.com/api/admin";

export let BASE_URL = REMOTE_URL;
let backendOnline = false;

// 1. Healthcheck to verify if Spring Boot is online (Local first, then Remote)
export const checkBackendHealth = async () => {
  // Try Local first
  try {
    const response = await fetch(`${LOCAL_URL}/health`, { 
      method: "GET",
      signal: AbortSignal.timeout(800)
    });
    if (response.ok) {
      BASE_URL = LOCAL_URL;
      backendOnline = true;
      return true;
    }
  } catch (error) {
    // Ignore local error
  }

  // Try Remote next
  try {
    const response = await fetch(`${REMOTE_URL}/health`, { 
      method: "GET",
      signal: AbortSignal.timeout(1500)
    });
    if (response.ok) {
      BASE_URL = REMOTE_URL;
      backendOnline = true;
      return true;
    }
  } catch (error) {
    // Ignore remote error
  }

  backendOnline = false;
  return false;
};

export const isBackendOnline = () => backendOnline;

// ==========================================
// API WRAPPERS WITH OFFLINE FALLBACKS
// ==========================================

// 1. Sessions APIs
export const fetchSessionsApi = async (fallbackData) => {
  const online = await checkBackendHealth();
  if (online) {
    try {
      const res = await fetch(`${BASE_URL}/sessions`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Spring Boot connection lost during fetch. Falling back.");
    }
  }
  return fallbackData;
};

export const createSessionApi = async (sessionDto) => {
  if (backendOnline) {
    try {
      await fetch(`${BASE_URL}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sessionDto)
      });
      return true;
    } catch (e) {
      console.error(e);
    }
  }
  return false;
};

export const renewSessionApi = async (id) => {
  if (backendOnline) {
    try {
      await fetch(`${BASE_URL}/sessions/${id}/renew`, { method: "POST" });
      return true;
    } catch (e) {
      console.error(e);
    }
  }
  return false;
};

export const deleteSessionApi = async (id) => {
  if (backendOnline) {
    try {
      await fetch(`${BASE_URL}/sessions/${id}`, { method: "DELETE" });
      return true;
    } catch (e) {
      console.error(e);
    }
  }
  return false;
};

// 2. Audit Logs APIs
export const fetchAuditLogsApi = async (fallbackData) => {
  if (backendOnline) {
    try {
      const res = await fetch(`${BASE_URL}/audit-logs`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.error(e);
    }
  }
  return fallbackData;
};

export const createAuditLogApi = async (logEntity) => {
  if (backendOnline) {
    try {
      await fetch(`${BASE_URL}/audit-logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(logEntity)
      });
      return true;
    } catch (e) {
      console.error(e);
    }
  }
  return false;
};

// 3. User Accounts APIs
export const fetchUsersApi = async (fallbackData) => {
  if (backendOnline) {
    try {
      const res = await fetch(`${BASE_URL}/users`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.error(e);
    }
  }
  return fallbackData;
};

export const createUserApi = async (userEntity) => {
  if (backendOnline) {
    try {
      await fetch(`${BASE_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userEntity)
      });
      return true;
    } catch (e) {
      console.error(e);
    }
  }
  return false;
};
