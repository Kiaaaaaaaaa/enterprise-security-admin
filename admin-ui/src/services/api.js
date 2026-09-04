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
      const res = await fetch(`${BASE_URL}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sessionDto)
      });
      return res.ok;
    } catch (e) {
      console.error("Create session failed:", e);
    }
  }
  return false;
};

export const renewSessionApi = async (id) => {
  if (backendOnline) {
    try {
      const res = await fetch(`${BASE_URL}/sessions/${id}/renew`, { method: "POST" });
      return res.ok;
    } catch (e) {
      console.error("Renew session failed:", e);
    }
  }
  return false;
};

export const deleteSessionApi = async (id) => {
  if (backendOnline) {
    try {
      const res = await fetch(`${BASE_URL}/sessions/${id}`, { method: "DELETE" });
      return res.ok;
    } catch (e) {
      console.error("Delete session failed:", e);
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
      console.error("Fetch audit logs failed:", e);
    }
  }
  return fallbackData;
};

export const createAuditLogApi = async (logEntity) => {
  if (backendOnline) {
    try {
      const res = await fetch(`${BASE_URL}/audit-logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(logEntity)
      });
      return res.ok;
    } catch (e) {
      console.error("Create audit log failed:", e);
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
      console.error("Fetch users failed:", e);
    }
  }
  return fallbackData;
};

export const createUserApi = async (userEntity) => {
  if (backendOnline) {
    try {
      const res = await fetch(`${BASE_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userEntity)
      });
      return res.ok;
    } catch (e) {
      console.error("Create user failed:", e);
    }
  }
  return false;
};

// 4. Common Codes APIs (PostgreSQL)
export const fetchCodesApi = async (fallbackData = []) => {
  if (backendOnline) {
    try {
      const res = await fetch(`${BASE_URL}/codes`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.error("Fetch codes failed:", e);
    }
  }
  return fallbackData;
};

export const createCodeApi = async (codeEntity) => {
  if (backendOnline) {
    try {
      const res = await fetch(`${BASE_URL}/codes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(codeEntity)
      });
      return res.ok;
    } catch (e) {
      console.error("Create code failed:", e);
    }
  }
  return false;
};

// 5. Real-time System Metrics API
export const fetchSystemMetricsApi = async () => {
  if (backendOnline) {
    try {
      const res = await fetch(`${BASE_URL}/system/metrics`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.error("Fetch system metrics failed:", e);
    }
  }
  return null;
};

// 6. Dynamic Client Info & IP Detection API
export const fetchClientInfoApi = async () => {
  if (backendOnline) {
    try {
      const res = await fetch(`${BASE_URL}/client-info`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.error("Fetch client info failed:", e);
    }
  }
  return {
    ip: "127.0.0.1",
    os: navigator.userAgent.includes("Windows") ? "Windows PC" : (navigator.userAgent.includes("Mac") ? "macOS" : "Linux"),
    browser: navigator.userAgent.includes("Chrome") ? "Google Chrome" : "Web Browser",
    serverTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
    isLocal: true
  };
};

// 7. Database-driven Admin Login API
export const loginApi = async (loginReq) => {
  if (backendOnline) {
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginReq)
      });
      if (res.ok) {
        return { success: true, data: await res.json() };
      }
      const err = await res.json();
      return { success: false, message: err.message || "로그인에 실패했습니다." };
    } catch (e) {
      console.error("Login request failed:", e);
      return { success: false, message: "백엔드 서버와의 통신에 실패했습니다." };
    }
  }
  // Offline fallback
  return { 
    success: true, 
    data: { id: loginReq.username, name: "최고 관리자 (오프라인)", role: "SUPER_ADMIN", dept: "정보보안본부" } 
  };
};
