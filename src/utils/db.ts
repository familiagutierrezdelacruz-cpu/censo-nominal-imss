import { openDB, IDBPDatabase } from 'idb';
import { CensusRecord } from '../types/census';

const DB_NAME = 'censo-nominal-db';
const STORE_NAME = 'pending-sync';
const CACHE_STORE = 'records-cache';

export interface PendingSyncItem {
    id?: number;
    data: any;
    type: 'CREATE' | 'UPDATE' | 'DELETE' | 'ARCHIVE' | 'RESTORE';
    url: string;
    method: string;
    timestamp: string;
}

export async function initDB() {
    return openDB(DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains(CACHE_STORE)) {
                db.createObjectStore(CACHE_STORE, { keyPath: 'id' });
            }
        },
    });
}

export async function savePendingAction(action: Omit<PendingSyncItem, 'id' | 'timestamp'>) {
    const db = await initDB();
    return db.add(STORE_NAME, {
        ...action,
        timestamp: new Date().toISOString()
    });
}

export async function getPendingRecords() {
    const db = await initDB();
    return db.getAll(STORE_NAME);
}

export async function clearPendingRecord(id: number) {
    const db = await initDB();
    return db.delete(STORE_NAME, id);
}

export async function cacheRecords(records: CensusRecord[]) {
    const db = await initDB();
    const tx = db.transaction(CACHE_STORE, 'readwrite');
    await tx.objectStore(CACHE_STORE).clear();
    for (const record of records) {
        await tx.objectStore(CACHE_STORE).put(record);
    }
    await tx.done;
}

export async function getCachedRecords() {
    const db = await initDB();
    return db.getAll(CACHE_STORE);
}
