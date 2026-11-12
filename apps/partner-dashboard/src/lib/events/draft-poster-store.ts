const DATABASE_NAME = 'c1rcle-event-draft-media';
const STORE_NAME = 'posters';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject(request.error ?? new Error('Could not open poster draft storage.'));
    };
  });
}

export async function saveDraftPoster(organizationId: string, file: File): Promise<void> {
  if (typeof indexedDB === 'undefined') return;
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put(file, organizationId);
      transaction.oncomplete = () => {
        resolve();
      };
      transaction.onerror = () => {
        reject(transaction.error ?? new Error('Could not save the poster for this draft.'));
      };
      transaction.onabort = () => {
        reject(transaction.error ?? new Error('Could not save the poster for this draft.'));
      };
    });
  } finally {
    database.close();
  }
}

export async function getDraftPoster(organizationId: string): Promise<File | null> {
  if (typeof indexedDB === 'undefined') return null;
  const database = await openDatabase();
  try {
    return await new Promise<File | null>((resolve, reject) => {
      const request = database
        .transaction(STORE_NAME, 'readonly')
        .objectStore(STORE_NAME)
        .get(organizationId) as IDBRequest<unknown>;
      request.onsuccess = () => {
        const stored = request.result;
        resolve(stored instanceof File ? stored : null);
      };
      request.onerror = () => {
        reject(request.error ?? new Error('Could not restore the draft poster.'));
      };
    });
  } finally {
    database.close();
  }
}

export async function clearDraftPoster(organizationId: string): Promise<void> {
  if (typeof indexedDB === 'undefined') return;
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).delete(organizationId);
      transaction.oncomplete = () => {
        resolve();
      };
      transaction.onerror = () => {
        reject(transaction.error ?? new Error('Could not clear the saved draft poster.'));
      };
      transaction.onabort = () => {
        reject(transaction.error ?? new Error('Could not clear the saved draft poster.'));
      };
    });
  } finally {
    database.close();
  }
}
