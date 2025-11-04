/*
 Lightweight Firebase integration with graceful fallback.
 Usage:
 1) Create a Firebase project and Firestore database.
 2) Set window.FIREBASE_CONFIG in a separate inline script before this file OR edit below placeholder.
 3) When FIREBASE_CONFIG is present, Firestore/Auth will be used. Otherwise, existing JSON/localStorage logic will run.
*/

(function () {
  const globalObj = typeof window !== 'undefined' ? window : global;

  // Allow users to define FIREBASE_CONFIG in HTML before this script.
  const firebaseConfig = globalObj.FIREBASE_CONFIG || null;

  const state = {
    enabled: false,
    app: null,
    auth: null,
    db: null,
  };

  async function lazyLoadFirebase() {
    if (!firebaseConfig) return false;

    // Load Firebase modular SDKs via CDN only once
    async function loadScript(src) {
      return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.defer = true;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }

    // If already loaded, skip
    if (globalObj.firebase && globalObj.firebase.apps) {
      return true;
    }

    // Firebase v10 compat build (simpler in plain HTML without bundlers)
    await loadScript('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
    await loadScript('https://www.gstatic.com/firebasejs/10.13.2/firebase-auth-compat.js');
    await loadScript('https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore-compat.js');

    return true;
  }

  async function init() {
    try {
      if (!firebaseConfig) return false;
      const loaded = await lazyLoadFirebase();
      if (!loaded) return false;

      const app = globalObj.firebase.initializeApp(firebaseConfig);
      const auth = globalObj.firebase.auth();
      const db = globalObj.firebase.firestore();

      state.enabled = true;
      state.app = app;
      state.auth = auth;
      state.db = db;
      return true;
    } catch (e) {
      console.warn('Firebase init failed, using fallback:', e);
      state.enabled = false;
      return false;
    }
  }

  // API wrappers (no-throw, return null/[] on failure)
  const api = {
    isEnabled() {
      return state.enabled;
    },

    async signInWithEmailPassword(email, password) {
      if (!state.enabled) return null;
      try {
        const cred = await state.auth.signInWithEmailAndPassword(email, password);
        return cred.user || null;
      } catch (e) {
        return null;
      }
    },

    async signOut() {
      if (!state.enabled) return;
      try {
        await state.auth.signOut();
      } catch (_) {}
    },

    async getFacultyByEmail(email) {
      if (!state.enabled) return null;
      try {
        const snap = await state.db.collection('faculty').where('email', '==', email).limit(1).get();
        if (snap.empty) return null;
        return { id: snap.docs[0].id, ...snap.docs[0].data() };
      } catch (e) {
        return null;
      }
    },

    async getCoursesByIds(courseIds) {
      if (!state.enabled) return [];
      if (!Array.isArray(courseIds) || courseIds.length === 0) return [];
      try {
        // batched fetch by ids (in clauses limited to 10 per query in Firestore)
        const chunks = [];
        for (let i = 0; i < courseIds.length; i += 10) {
          chunks.push(courseIds.slice(i, i + 10));
        }
        const results = [];
        for (const ids of chunks) {
          const snap = await state.db.collection('courses').where('id', 'in', ids).get();
          snap.forEach((doc) => results.push(doc.data()));
        }
        return results;
      } catch (e) {
        return [];
      }
    },

    async getAllStudents() {
      if (!state.enabled) return [];
      try {
        const snap = await state.db.collection('students').get();
        return snap.docs.map((d) => d.data());
      } catch (e) {
        return [];
      }
    },

    async saveAttendance(record) {
      if (!state.enabled) return false;
      try {
        // Upsert by (course_id + date)
        const key = `${record.course_id}_${record.date}`;
        await state.db.collection('attendance').doc(key).set(record, { merge: true });
        return true;
      } catch (e) {
        return false;
      }
    },

    async getAttendanceByCourse(courseId) {
      if (!state.enabled) return [];
      try {
        const snap = await state.db
          .collection('attendance')
          .where('course_id', '==', courseId)
          .get();
        return snap.docs.map((d) => d.data());
      } catch (e) {
        return [];
      }
    },
  };

  // Expose globally
  globalObj.AppBackend = {
    init,
    api,
  };
})();



