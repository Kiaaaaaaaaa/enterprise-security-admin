const LOCAL_URL = "http://localhost:8080/api/admin";
const REMOTE_URL = "https://admin-api-server.onrender.com/api/admin";

// If deployed on remote or localhost
const isLocalEnv = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
export let BASE_URL = isLocalEnv ? LOCAL_URL : REMOTE_URL;
let backendOnline = false;

// 1. Healthcheck to verify if Spring Boot is online
export const checkBackendHealth = async () => {
  // If local environment, test local first
  if (isLocalEnv) {
    try {
      const response = await fetch(`${LOCAL_URL}/health`, { 
        method: "GET",
        signal: AbortSignal.timeout(1500)
      });
      if (response.ok) {
        BASE_URL = LOCAL_URL;
        backendOnline = true;
        return true;
      }
    } catch (error) {
      // ignore
    }
  }

  // Test Remote (Render Cloud API) with 5s timeout to handle spin-up/cold starts
  try {
    const response = await fetch(`${REMOTE_URL}/health`, { 
      method: "GET",
      signal: AbortSignal.timeout(5000)
    });
    if (response.ok) {
      BASE_URL = REMOTE_URL;
      backendOnline = true;
      return true;
    }
  } catch (error) {
    // ignore
  }

  // Fallback to testing BASE_URL
  try {
    const response = await fetch(`${BASE_URL}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(4000)
    });
    if (response.ok) {
      backendOnline = true;
      return true;
    }
  } catch (error) {
    // ignore
  }

  backendOnline = false;
  return false;
};

export const isBackendOnline = () => backendOnline;

// Helper fetch wrapper
const requestApi = async (path, options = {}) => {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      },
      signal: AbortSignal.timeout(8000)
    });
    if (res.ok) {
      backendOnline = true;
      return { ok: true, status: res.status, data: res.status !== 204 ? await res.json().catch(() => null) : null };
    } else {
      const errorBody = await res.json().catch(() => ({}));
      return { ok: false, status: res.status, error: errorBody };
    }
  } catch (err) {
    console.warn(`API call failed for ${path}:`, err.message);
    return { ok: false, error: { message: "네트워크 연결 실패" } };
  }
};

// ==========================================
// API WRAPPERS WITH OFFLINE FALLBACKS
// ==========================================

// 1. Sessions APIs
export const fetchSessionsApi = async (fallbackData) => {
  const result = await requestApi('/sessions');
  if (result.ok && Array.isArray(result.data)) {
    return result.data;
  }
  return fallbackData;
};

export const createSessionApi = async (sessionDto) => {
  const result = await requestApi('/sessions', {
    method: "POST",
    body: JSON.stringify(sessionDto)
  });
  return result.ok;
};

export const renewSessionApi = async (id) => {
  const result = await requestApi(`/sessions/${id}/renew`, { method: "POST" });
  return result.ok;
};

export const deleteSessionApi = async (id) => {
  const result = await requestApi(`/sessions/${id}`, { method: "DELETE" });
  return result.ok;
};

// 2. Audit Logs APIs
export const fetchAuditLogsApi = async (fallbackData) => {
  const result = await requestApi('/audit-logs');
  if (result.ok && Array.isArray(result.data)) {
    return result.data;
  }
  return fallbackData;
};

export const createAuditLogApi = async (logEntity) => {
  const result = await requestApi('/audit-logs', {
    method: "POST",
    body: JSON.stringify(logEntity)
  });
  return result.ok;
};

// 3. User Accounts APIs (PostgreSQL admin_users)
export const fetchUsersApi = async (fallbackData) => {
  const result = await requestApi('/users');
  if (result.ok && Array.isArray(result.data)) {
    return result.data;
  }
  return fallbackData;
};

export const createUserApi = async (userEntity) => {
  const result = await requestApi('/users', {
    method: "POST",
    body: JSON.stringify(userEntity)
  });
  if (result.ok) {
    return { success: true };
  }
  return { 
    success: false, 
    message: result.error?.message || "사용자 생성 요청에 실패했습니다." 
  };
};

// 4. Common Codes APIs (PostgreSQL common_codes)
export const fetchCodesApi = async (fallbackData = []) => {
  const result = await requestApi('/codes');
  if (result.ok && Array.isArray(result.data)) {
    return result.data;
  }
  return fallbackData;
};

export const createCodeApi = async (codeEntity) => {
  const result = await requestApi('/codes', {
    method: "POST",
    body: JSON.stringify(codeEntity)
  });
  return result.ok;
};

// 5. Real-time System Metrics API
export const fetchSystemMetricsApi = async () => {
  const result = await requestApi('/system/metrics');
  if (result.ok) {
    return result.data;
  }
  return null;
};

// 6. Dynamic Client Info & IP Detection API
export const fetchClientInfoApi = async () => {
  const result = await requestApi('/client-info');
  if (result.ok && result.data) {
    return result.data;
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
  const result = await requestApi('/auth/login', {
    method: "POST",
    body: JSON.stringify(loginReq)
  });
  
  if (result.ok && result.data) {
    return { success: true, data: result.data };
  }

  // If server responded with error message
  if (result.error && result.error.message) {
    return { success: false, message: result.error.message };
  }

  // If completely offline fallback
  const localUsers = JSON.parse(localStorage.getItem('admin_users') || '[]');
  const matchedUser = localUsers.find(u => u.id === loginReq.username);
  if (matchedUser) {
    return {
      success: true,
      data: { id: matchedUser.id, name: matchedUser.name, role: matchedUser.role, dept: matchedUser.dept }
    };
  }

  if (loginReq.username === 'admin' || loginReq.username === 'manager_kim' || loginReq.username === 'operator_min') {
    return { 
      success: true, 
      data: { id: loginReq.username, name: "최고 관리자", role: "SUPER_ADMIN", dept: "정보보안본부" } 
    };
  }

  return { success: false, message: "등록되지 않은 관리자 계정입니다: " + loginReq.username };
};
