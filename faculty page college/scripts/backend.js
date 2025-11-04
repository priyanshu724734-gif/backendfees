(function () {
  const BASE = '';

  async function jsonFetch(url, options = {}) {
    try {
      const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        ...options,
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (_) {
      return null;
    }
  }

  const api = {
    async login(email, password) {
      const data = await jsonFetch(`${BASE}/api/login`, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      return data && data.profile ? data.profile : null;
    },

    async getCoursesByIds(ids) {
      if (!Array.isArray(ids) || ids.length === 0) return [];
      const data = await jsonFetch(`${BASE}/api/courses?ids=${encodeURIComponent(ids.join(','))}`);
      return data && Array.isArray(data.courses) ? data.courses : [];
    },

    async getAllStudents() {
      const data = await jsonFetch(`${BASE}/api/students`);
      return data && Array.isArray(data.students) ? data.students : [];
    },

    async saveAttendance(record) {
      const data = await jsonFetch(`${BASE}/api/attendance`, {
        method: 'POST',
        body: JSON.stringify(record),
      });
      return !!(data && data.ok);
    },

    async getAttendanceByCourse(courseId) {
      const data = await jsonFetch(`${BASE}/api/attendance?courseId=${encodeURIComponent(courseId)}`);
      return data && Array.isArray(data.records) ? data.records : [];
    },
  };

  window.AppBackendVercel = { api };
})();


