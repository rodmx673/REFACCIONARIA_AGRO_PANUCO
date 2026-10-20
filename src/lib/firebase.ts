// Archivo temporal para evitar errores de compilación
// Mientras migramos los módulos a Google Sheets
export const db = null;
export const auth = { currentUser: { uid: 'admin', email: 'admin@local' } };
export const handleFirestoreError = () => {};
export const OperationType = { GET: 'get', WRITE: 'write', CREATE: 'create', UPDATE: 'update', DELETE: 'delete' };
export const collection = () => {};
export const getDocs = async () => ({ docs: [], empty: true });
export const query = () => {};
export const orderBy = () => {};
export const onSnapshot = () => () => {};
export const addDoc = async () => ({ id: 'stub-id' });
export const updateDoc = async () => {};
export const deleteDoc = async () => {};
export const doc = () => {};
export const setDoc = async () => {};
export const serverTimestamp = () => new Date().toISOString();
export const increment = (n: number) => n;
export const limit = () => {};
export const where = () => {};
export const getDoc = async () => ({ exists: () => false, data: () => ({}) });
export const runTransaction = async () => {};