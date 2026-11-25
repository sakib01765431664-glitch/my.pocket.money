import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from '../constants/defaults';
import type { AppSettings, Category, Expense, IncomeEntry } from '../types/expense';

const DB_NAME = 'my_pocket_expense_db';
const DB_VERSION = 1;
const STORE_NAME = 'app_state';

const LS_KEYS = {
  expenses: 'mpe_expenses_v1',
  incomes: 'mpe_incomes_v1',
  categories: 'mpe_categories_v1',
  settings: 'mpe_settings_v1',
} as const;

export interface PersistedState {
  expenses: Expense[];
  incomes: IncomeEntry[];
  categories: Category[];
  settings: AppSettings;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB error'));
  });
}

async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

export function loadFromLocalStorageSync(): PersistedState {
  try {
    const rawExp = window.localStorage.getItem(LS_KEYS.expenses);
    const rawInc = window.localStorage.getItem(LS_KEYS.incomes);
    const rawCat = window.localStorage.getItem(LS_KEYS.categories);
    const rawSet = window.localStorage.getItem(LS_KEYS.settings);

    const expenses: Expense[] = rawExp ? JSON.parse(rawExp) : [];
    const incomes: IncomeEntry[] = rawInc ? JSON.parse(rawInc) : [];
    const categories: Category[] = rawCat ? JSON.parse(rawCat) : DEFAULT_CATEGORIES;
    const settings: AppSettings = rawSet
      ? { ...DEFAULT_SETTINGS, ...JSON.parse(rawSet) }
      : DEFAULT_SETTINGS;

    return {
      expenses: Array.isArray(expenses) ? expenses : [],
      incomes: Array.isArray(incomes) ? incomes : [],
      categories: Array.isArray(categories) && categories.length > 0 ? categories : DEFAULT_CATEGORIES,
      settings,
    };
  } catch {
    return {
      expenses: [],
      incomes: [],
      categories: DEFAULT_CATEGORIES,
      settings: DEFAULT_SETTINGS,
    };
  }
}

export async function loadPersistedState(): Promise<PersistedState> {
  const syncState = loadFromLocalStorageSync();
  try {
    const [idbExpenses, idbIncomes, idbCategories, idbSettings] = await Promise.all([
      idbGet<Expense[]>('expenses'),
      idbGet<IncomeEntry[]>('incomes'),
      idbGet<Category[]>('categories'),
      idbGet<AppSettings>('settings'),
    ]);

    const expenses = Array.isArray(idbExpenses) ? idbExpenses : syncState.expenses;
    const incomes = Array.isArray(idbIncomes) ? idbIncomes : syncState.incomes;
    const categories =
      Array.isArray(idbCategories) && idbCategories.length > 0
        ? idbCategories
        : syncState.categories;
    const settings = idbSettings ? { ...DEFAULT_SETTINGS, ...idbSettings } : syncState.settings;

    return { expenses, incomes, categories, settings };
  } catch {
    return syncState;
  }
}

export async function saveExpensesState(expenses: Expense[]): Promise<void> {
  try {
    window.localStorage.setItem(LS_KEYS.expenses, JSON.stringify(expenses));
  } catch {
    // ignore storage quota errors on mirror
  }
  try {
    await idbSet('expenses', expenses);
  } catch {
    // fallback already written to localStorage
  }
}

export async function saveIncomesState(incomes: IncomeEntry[]): Promise<void> {
  try {
    window.localStorage.setItem(LS_KEYS.incomes, JSON.stringify(incomes));
  } catch {
    // ignore
  }
  try {
    await idbSet('incomes', incomes);
  } catch {
    // ignore
  }
}

export async function saveCategoriesState(categories: Category[]): Promise<void> {
  try {
    window.localStorage.setItem(LS_KEYS.categories, JSON.stringify(categories));
  } catch {
    // ignore
  }
  try {
    await idbSet('categories', categories);
  } catch {
    // ignore
  }
}

export async function saveSettingsState(settings: AppSettings): Promise<void> {
  try {
    window.localStorage.setItem(LS_KEYS.settings, JSON.stringify(settings));
  } catch {
    // ignore
  }
  try {
    await idbSet('settings', settings);
  } catch {
    // ignore
  }
}
