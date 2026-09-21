// Try multiple ports in case 5000 is blocked on Mac (AirPlay uses 5000)
const PORTS = [5000, 5001, 5002, 3001];

let BACKEND_URL = null;

const detectBackend = async () => {
  if (BACKEND_URL) return BACKEND_URL;
  for (const port of PORTS) {
    try {
      const res = await fetch(`http://localhost:${port}/api/health`, {
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) {
        BACKEND_URL = `http://localhost:${port}/api`;
        console.log(`[API] Backend found at port ${port}`);
        return BACKEND_URL;
      }
    } catch { /* try next port */ }
  }
  throw new Error('Backend not reachable on ports 5000, 5001, 5002, or 3001. Please start the backend server.');
};

const tok = () => localStorage.getItem('icu_token');

const req = async (path, opts = {}) => {
  const base = await detectBackend();
  let res;
  try {
    res = await fetch(`${base}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(tok() ? { Authorization: `Bearer ${tok()}` } : {}),
      },
      ...opts,
    });
  } catch (err) {
    BACKEND_URL = null; // reset so next call re-detects
    throw new Error('Cannot reach backend server. Is it still running?');
  }

  const text = await res.text();

  if (!text || text.trim() === '') {
    throw new Error('Server returned empty response. Please try again.');
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    console.error('Non-JSON response:', text.slice(0, 200));
    throw new Error('Invalid response from server.');
  }

  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }

  return data;
};

export const authAPI = {
  login:    (body) => req('/auth/login',    { method: 'POST', body: JSON.stringify(body) }),
  register: (body) => req('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  getMe:    ()     => req('/auth/me'),
  getUsers: ()     => req('/auth/users'),
};

export const patientAPI = {
  getAll:       ()         => req('/patients'),
  getById:      (id)       => req(`/patients/${id}`),
  add:          (body)     => req('/patients',                  { method: 'POST',   body: JSON.stringify(body) }),
  update:       (id, body) => req(`/patients/${id}`,           { method: 'PUT',    body: JSON.stringify(body) }),
  updateVitals: (id, body) => req(`/patients/${id}/vitals`,    { method: 'PUT',    body: JSON.stringify(body) }),
  addNote:      (id, body) => req(`/patients/${id}/notes`,     { method: 'POST',   body: JSON.stringify(body) }),
  discharge:    (id)       => req(`/patients/${id}/discharge`, { method: 'PUT' }),
  delete:       (id)       => req(`/patients/${id}`,           { method: 'DELETE' }),
  analytics:    ()         => req('/patients/analytics'),
};
