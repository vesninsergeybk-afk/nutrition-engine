// Versioned local-first boundary shared by VesninMed workspaces.
// Compare-and-swap protects a session from silent overwrites in another tab.
const DATABASE = 'vesninmed-workspaces';
const STORE = 'states';
const ENVELOPE_VERSION = 1;
let connection;

function open() {
  if (!connection) connection = new Promise((resolve, reject) => {
    let request;
    try { request = indexedDB.open(DATABASE, 1); } catch (error) { reject(error); return; }
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'key' });
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('storage-blocked'));
    request.onsuccess = () => {
      const database = request.result;
      database.onversionchange = () => { database.close(); connection = undefined; };
      resolve(database);
    };
  });
  return connection;
}

export class WorkspaceStorage {
  constructor(key, { validate, onStatus = () => {} }) {
    this.key = key; this.validate = validate; this.onStatus = onStatus;
    this.revision = 0; this.writable = true; this.queue = Promise.resolve();
  }
  status(value) { this.onStatus(value); }
  async read() {
    try {
      const database = await open();
      const raw = await new Promise((resolve, reject) => {
        const transaction = database.transaction(STORE, 'readonly');
        const request = transaction.objectStore(STORE).get(this.key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        transaction.onabort = () => reject(transaction.error);
      });
      if (!raw) { this.status('ready'); return null; }
      if (raw.version !== ENVELOPE_VERSION || !Number.isSafeInteger(raw.revision) ||
          raw.revision < 1 || !this.validate(raw.payload)) {
        // Keep incompatible or damaged bytes. Never replace them with a blank session.
        this.writable = false; this.status('incompatible'); return null;
      }
      this.revision = raw.revision; this.status('restored'); return raw.payload;
    } catch {
      this.writable = false; this.status('unavailable'); return null;
    }
  }
  write(payload) {
    // Capture a plain domain snapshot now, before later UI actions can change it.
    let captured;
    try { captured = structuredClone(payload); } catch { this.status('invalid'); return Promise.resolve(false); }
    if (!this.writable) return Promise.resolve(false);
    if (!this.validate(captured)) { this.status('invalid'); return Promise.resolve(false); }
    this.status('pending');
    this.queue = this.queue.then(async () => {
      try {
        const database = await open();
        await new Promise((resolve, reject) => {
          const transaction = database.transaction(STORE, 'readwrite');
          const states = transaction.objectStore(STORE);
          let reason;
          const request = states.get(this.key);
          request.onsuccess = () => {
            const current = request.result;
            if ((current?.revision || 0) !== this.revision ||
                (current && current.version !== ENVELOPE_VERSION)) {
              reason = new Error('conflict'); transaction.abort(); return;
            }
            states.put({ key: this.key, version: ENVELOPE_VERSION,
              revision: this.revision + 1, updatedAt: Date.now(), payload: captured });
          };
          transaction.oncomplete = () => { this.revision += 1; resolve(); };
          transaction.onerror = () => reject(transaction.error);
          transaction.onabort = () => reject(reason || transaction.error);
        });
        this.status('saved'); return true;
      } catch (error) {
        this.writable = false;
        this.status(error?.message === 'conflict' ? 'conflict' : 'unavailable');
        return false;
      }
    });
    return this.queue;
  }
  flush() { return this.queue; }
}
