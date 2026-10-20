// Stub de Firebase para mantener compatibilidad de imports
// Mientras se migran todos los módulos a Google Sheets
export const initializeApp = () => ({});
export const getApps = () => [];
export const getApp = () => ({});
export const getAuth = () => ({ currentUser: { uid: 'admin' } });
export const onAuthStateChanged = (auth: any, cb: any) => { cb(null); return () => {}; };
export const signInWithPopup = async () => {};
export const GoogleAuthProvider = function() { return {}; };
export const signInAnonymously = async () => {};
export const signInWithRedirect = async () => {};
export const getRedirectResult = async () => null;

export const db = {};
export const collection = () => ({});
export const getDocs = async () => ({ docs: [], empty: true });
export const query = () => ({});
export const orderBy = () => ({});
export const onSnapshot = () => () => {};
export const addDoc = async () => ({ id: 'stub' });
export const updateDoc = async () => {};
export const deleteDoc = async () => {};
export const doc = () => ({});
export const setDoc = async () => {};
export const serverTimestamp = () => new Date().toISOString();
export const increment = (n: number) => n;
export const limit = () => ({});
export const where = () => ({});
export const getDoc = async () => ({ exists: () => false, data: () => ({}) });
export const runTransaction = async () => {};

export const handleFirestoreError = () => {};
export const OperationType = { GET: 'get', WRITE: 'write', CREATE: 'create', UPDATE: 'update', DELETE: 'delete' };