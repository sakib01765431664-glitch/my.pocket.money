import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  History,
  Home,
  Moon,
  Plus,
  Settings,
  Sun,
  Wallet,
} from 'lucide-react';
import { CategoryManagerModal } from './components/CategoryManagerModal';
import { DashboardView } from './components/DashboardView';
import { ExpenseFormModal } from './components/ExpenseFormModal';
import { HistoryView } from './components/HistoryView';
import { IncomeFormModal } from './components/IncomeFormModal';
import { QuickBudgetModal } from './components/QuickBudgetModal';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { TodaysExpensesModal } from './components/TodaysExpensesModal';
import { DEFAULT_CATEGORIES } from './constants/defaults';
import type { AppSettings, Category, Expense, IncomeEntry, NavTab } from './types/expense';
import {
  buildExpensesCsv,
  computeBudgetSummary,
  computeDashboardMetrics,
  computeMonthlyIncomeTotal,
  createBackupPayload,
  getTodayDateString,
  parseAndValidateBackup,
} from './utils/calculations';
import { TEXT } from './utils/i18n';
import {
  loadFromLocalStorageSync,
  loadPersistedState,
  saveCategoriesState,
  saveExpensesState,
  saveIncomesState,
  saveSettingsState,
} from './utils/storage';

function generateId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function downloadTextFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function App() {
  const initialSync = useMemo(() => loadFromLocalStorageSync(), []);

  const [expenses, setExpenses] = useState<Expense[]>(initialSync.expenses);
  const [incomes, setIncomes] = useState<IncomeEntry[]>(initialSync.incomes);
  const [categories, setCategories] = useState<Category[]>(initialSync.categories);
  const [settings, setSettings] = useState<AppSettings>(initialSync.settings);
  const [activeTab, setActiveTab] = useState<NavTab>('home');

  // Modals
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [modalDefaultDate, setModalDefaultDate] = useState<string | undefined>(undefined);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [incomeModalOpen, setIncomeModalOpen] = useState(false);
  const [todaysModalOpen, setTodaysModalOpen] = useState(false);
  const [quickBudgetModalOpen, setQuickBudgetModalOpen] = useState(false);

  // Subtle Undo / Status Toast
  const [toast, setToast] = useState<{
    message: string;
    undoExpense?: Expense;
  } | null>(null);

  const lang = settings.language;
  const t = TEXT[lang];

  // Hydrate from IndexedDB on mount
  useEffect(() => {
    let active = true;
    loadPersistedState().then((persisted) => {
      if (!active) return;
      setExpenses(persisted.expenses);
      setIncomes(persisted.incomes);
      setCategories(persisted.categories);
      setSettings(persisted.settings);
    });
    return () => {
      active = false;
    };
  }, []);

  // Sync theme and language to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    root.lang = settings.language;
  }, [settings.theme, settings.language]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const updateExpenses = useCallback((updater: (prev: Expense[]) => Expense[]) => {
    setExpenses((prev) => {
      const next = updater(prev);
      void saveExpensesState(next);
      return next;
    });
  }, []);

  const updateIncomes = useCallback((updater: (prev: IncomeEntry[]) => IncomeEntry[]) => {
    setIncomes((prev) => {
      const next = updater(prev);
      void saveIncomesState(next);
      return next;
    });
  }, []);

  const updateCategories = useCallback((updater: (prev: Category[]) => Category[]) => {
    setCategories((prev) => {
      const next = updater(prev);
      void saveCategoriesState(next);
      return next;
    });
  }, []);

  const handleUpdateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      void saveSettingsState(next);
      return next;
    });
  }, []);

  const openAddExpenseModal = useCallback((defaultDate?: string) => {
    setEditingExpense(null);
    setModalDefaultDate(defaultDate);
    setExpenseModalOpen(true);
  }, []);

  const openEditExpenseModal = useCallback((expense: Expense) => {
    setEditingExpense(expense);
    setModalDefaultDate(undefined);
    setExpenseModalOpen(true);
  }, []);

  const handleSaveExpense = useCallback(
    (data: {
      id?: string;
      amount: number;
      categoryId: string;
      description: string;
      date: string;
      time: string;
    }) => {
      const nowMs = Date.now();
      if (data.id) {
        updateExpenses((prev) =>
          prev.map((e) =>
            e.id === data.id
              ? {
                  ...e,
                  amount: data.amount,
                  categoryId: data.categoryId,
                  description: data.description,
                  date: data.date,
                  time: data.time,
                  updatedAt: nowMs,
                }
              : e
          )
        );
        setToast({
          message: lang === 'bn' ? 'খরচ আপডেট হয়েছে' : 'Expense updated',
        });
      } else {
        const newEntry: Expense = {
          id: generateId('exp'),
          amount: data.amount,
          categoryId: data.categoryId,
          description: data.description,
          date: data.date,
          time: data.time,
          createdAt: nowMs,
          updatedAt: nowMs,
        };
        updateExpenses((prev) => [newEntry, ...prev]);
        setToast({
          message: lang === 'bn' ? 'নতুন খরচ যোগ হয়েছে' : 'Expense added',
        });
      }
      setExpenseModalOpen(false);
      setEditingExpense(null);
    },
    [lang, updateExpenses]
  );

  const handleDeleteExpense = useCallback(
    (expenseId: string) => {
      const target = expenses.find((e) => e.id === expenseId);
      updateExpenses((prev) => prev.filter((e) => e.id !== expenseId));
      if (target) {
        setToast({
          message: lang === 'bn' ? 'খরচ মুছে ফেলা হয়েছে' : 'Expense deleted',
          undoExpense: target,
        });
      }
    },
    [expenses, lang, updateExpenses]
  );

  const handleUndoDelete = useCallback(() => {
    if (!toast?.undoExpense) return;
    const restored = toast.undoExpense;
    updateExpenses((prev) => [restored, ...prev]);
    setToast(null);
  }, [toast, updateExpenses]);

  const handleSaveCategory = useCallback(
    (catData: Omit<Category, 'id'> & { id?: string }) => {
      if (catData.id) {
        updateCategories((prev) =>
          prev.map((c) =>
            c.id === catData.id
              ? {
                  ...c,
                  nameBn: catData.nameBn,
                  nameEn: catData.nameEn,
                  color: catData.color,
                  icon: catData.icon,
                }
              : c
          )
        );
      } else {
        const created: Category = {
          id: generateId('cat'),
          nameBn: catData.nameBn,
          nameEn: catData.nameEn,
          color: catData.color,
          icon: catData.icon,
          isDefault: false,
        };
        updateCategories((prev) => [...prev, created]);
      }
    },
    [updateCategories]
  );

  const handleDeleteCategory = useCallback(
    (catId: string) => {
      if (catId === 'cat_other') return;
      const fallbackId =
        categories.find((c) => c.id === 'cat_other')?.id ??
        categories.find((c) => c.id !== catId)?.id ??
        DEFAULT_CATEGORIES[7].id;

      updateCategories((prev) => prev.filter((c) => c.id !== catId));
      updateExpenses((prev) =>
        prev.map((e) => (e.categoryId === catId ? { ...e, categoryId: fallbackId } : e))
      );
    },
    [categories, updateCategories, updateExpenses]
  );

  const handleSaveIncome = useCallback(
    (data: {
      amount: number;
      source: string;
      note: string;
      date: string;
      time: string;
    }) => {
      const nowMs = Date.now();
      const newIncome: IncomeEntry = {
        id: generateId('inc'),
        amount: data.amount,
        source: data.source,
        note: data.note,
        date: data.date,
        time: data.time,
        createdAt: nowMs,
        updatedAt: nowMs,
      };
      updateIncomes((prev) => [newIncome, ...prev]);
      setToast({
        message: lang === 'bn' ? 'নতুন আয় যোগ হয়েছে' : 'Income added',
      });
    },
    [lang, updateIncomes]
  );

  const handleDeleteIncome = useCallback(
    (incomeId: string) => {
      updateIncomes((prev) => prev.filter((inc) => inc.id !== incomeId));
      setToast({
        message: lang === 'bn' ? 'আয় মুছে ফেলা হয়েছে' : 'Income deleted',
      });
    },
    [lang, updateIncomes]
  );

  const handleExportJson = useCallback(() => {
    const payload = createBackupPayload(expenses, categories, settings, incomes);
    const filename = `my-pocket-money-backup-${getTodayDateString()}.json`;
    downloadTextFile(filename, JSON.stringify(payload, null, 2), 'application/json');
  }, [expenses, categories, settings, incomes]);

  const handleImportJson = useCallback(
    (rawText: string): boolean => {
      const parsed = parseAndValidateBackup(rawText);
      if (!parsed) return false;
      setExpenses(parsed.expenses);
      const nextIncomes = parsed.incomes ?? [];
      setIncomes(nextIncomes);
      setCategories(parsed.categories);
      setSettings(parsed.settings);
      void saveExpensesState(parsed.expenses);
      void saveIncomesState(nextIncomes);
      void saveCategoriesState(parsed.categories);
      void saveSettingsState(parsed.settings);
      return true;
    },
    []
  );

  const handleExportCsv = useCallback(() => {
    const csv = buildExpensesCsv(expenses, categories, lang);
    const filename = `my-pocket-money-${getTodayDateString()}.csv`;
    downloadTextFile(filename, csv, 'text/csv;charset=utf-8;');
  }, [expenses, categories, lang]);

  const handleDeleteAllExpenses = useCallback(() => {
    updateExpenses(() => []);
    setToast({
      message: lang === 'bn' ? 'সব খরচ মুছে ফেলা হয়েছে' : 'All expenses deleted',
    });
  }, [lang, updateExpenses]);

  // Derived Analytics
  const metrics = useMemo(() => computeDashboardMetrics(expenses), [expenses]);
  const monthIncomeTotal = useMemo(
    () => computeMonthlyIncomeTotal(incomes, metrics.currentMonthKey),
    [incomes, metrics.currentMonthKey]
  );
  const budgetSummary = useMemo(
    () => computeBudgetSummary(metrics.monthTotal, settings.monthlyBudget),
    [metrics.monthTotal, settings.monthlyBudget]
  );

  const recentExpenses = useMemo(() => {
    return [...expenses]
      .sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        if (a.time !== b.time) return b.time.localeCompare(a.time);
        return b.createdAt - a.createdAt;
      })
      .slice(0, 6);
  }, [expenses]);

  const handleNavSelect = (tab: NavTab) => {
    if (tab === 'add') {
      openAddExpenseModal();
      return;
    }
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100">
      {/* Desktop Left Sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:shrink-0 md:sticky md:top-0 md:h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 justify-between">
        <div className="space-y-6">
          {/* Brand */}
          <div className="px-2 pt-1 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5" aria-hidden="true" />
            </div>
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap">
              {t.appName}
            </span>
          </div>

          {/* Primary Add Expense Button */}
          <button
            type="button"
            onClick={() => openAddExpenseModal()}
            className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>{t.navAdd}</span>
          </button>

          {/* Navigation Links */}
          <nav aria-label="Main navigation" className="space-y-1">
            {[
              { id: 'home' as const, label: t.navHome, icon: Home },
              { id: 'history' as const, label: t.navHistory, icon: History },
              { id: 'reports' as const, label: t.navReports, icon: BarChart3 },
              { id: 'settings' as const, label: t.navSettings, icon: Settings },
            ].map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavSelect(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl flex items-center gap-3 text-sm font-semibold transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Quick Language & Theme Controls */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 px-1">
          <button
            type="button"
            onClick={() => handleUpdateSettings({ language: lang === 'bn' ? 'en' : 'bn' })}
            className="min-h-[38px] px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
          >
            {lang === 'bn' ? 'English' : 'বাংলা'}
          </button>
          <button
            type="button"
            onClick={() =>
              handleUpdateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })
            }
            aria-label={settings.theme === 'dark' ? t.lightMode : t.darkMode}
            className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            {settings.theme === 'dark' ? (
              <Sun className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Moon className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Compact Top Header (<= 52px) */}
      <header className="md:hidden sticky top-0 z-30 h-13 px-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <Wallet className="w-4 h-4" aria-hidden="true" />
          </div>
          <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate">
            {t.appName}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => handleUpdateSettings({ language: lang === 'bn' ? 'en' : 'bn' })}
            className="min-h-[34px] px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap"
          >
            {lang === 'bn' ? 'EN' : 'বাংলা'}
          </button>
          <button
            type="button"
            onClick={() =>
              handleUpdateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })
            }
            aria-label={settings.theme === 'dark' ? t.lightMode : t.darkMode}
            className="min-h-[34px] min-w-[34px] flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
          >
            {settings.theme === 'dark' ? (
              <Sun className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Moon className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 md:py-8 pb-24 md:pb-10">
        <div key={activeTab} className="view-enter">
          {activeTab === 'home' && (
            <DashboardView
              metrics={metrics}
              monthIncomeTotal={monthIncomeTotal}
              budgetSummary={budgetSummary}
              recentExpenses={recentExpenses}
              categories={categories}
              lang={lang}
              onAddExpense={() => openAddExpenseModal()}
              onAddIncome={() => setIncomeModalOpen(true)}
              onViewTodaysExpenses={() => setTodaysModalOpen(true)}
              onOpenQuickBudget={() => setQuickBudgetModalOpen(true)}
              onEditExpense={openEditExpenseModal}
              onDeleteExpense={handleDeleteExpense}
              onViewHistory={() => setActiveTab('history')}
            />
          )}

          {activeTab === 'history' && (
            <HistoryView
              expenses={expenses}
              categories={categories}
              lang={lang}
              onAddExpense={openAddExpenseModal}
              onEditExpense={openEditExpenseModal}
              onDeleteExpense={handleDeleteExpense}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView expenses={expenses} categories={categories} lang={lang} />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              expenseCount={expenses.length}
              categoryCount={categories.length}
              onUpdateSettings={handleUpdateSettings}
              onOpenCategoryManager={() => setCategoryModalOpen(true)}
              onExportJson={handleExportJson}
              onImportJson={handleImportJson}
              onExportCsv={handleExportCsv}
              onDeleteAllExpenses={handleDeleteAllExpenses}
            />
          )}
        </div>
      </main>

      {/* Mobile Fixed Bottom Navigation Bar (5 requested destinations) */}
      <nav
        aria-label="Bottom navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe"
      >
        <div className="grid grid-cols-5 items-center h-16 px-1">
          {(
            [
              { id: 'home' as const, label: t.navHome, icon: Home },
              { id: 'add' as const, label: t.navAdd, icon: Plus },
              { id: 'history' as const, label: t.navHistory, icon: History },
              { id: 'reports' as const, label: t.navReports, icon: BarChart3 },
              { id: 'settings' as const, label: t.navSettings, icon: Settings },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const isAdd = item.id === 'add';
            const isActive = activeTab === item.id;

            if (isAdd) {
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavSelect('add')}
                  aria-label={t.addExpense}
                  className="min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-emerald-600 dark:text-emerald-400"
                >
                  <span className="w-10 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                    <Plus className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <span className="text-[10px] font-semibold tracking-tight whitespace-nowrap">
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavSelect(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`min-h-[44px] flex flex-col items-center justify-center gap-1 transition-colors ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-5 h-5" aria-hidden="true" />
                <span className="text-[10px] font-medium tracking-tight whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Modals */}
      <ExpenseFormModal
        isOpen={expenseModalOpen}
        editingExpense={editingExpense}
        categories={categories}
        lang={lang}
        defaultDate={modalDefaultDate}
        onClose={() => {
          setExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        onSave={handleSaveExpense}
        onOpenCategoryManager={() => setCategoryModalOpen(true)}
      />

      <CategoryManagerModal
        isOpen={categoryModalOpen}
        categories={categories}
        lang={lang}
        onClose={() => setCategoryModalOpen(false)}
        onSaveCategory={handleSaveCategory}
        onDeleteCategory={handleDeleteCategory}
      />

      <IncomeFormModal
        isOpen={incomeModalOpen}
        incomes={incomes}
        lang={lang}
        onClose={() => setIncomeModalOpen(false)}
        onSaveIncome={handleSaveIncome}
        onDeleteIncome={handleDeleteIncome}
      />

      <TodaysExpensesModal
        isOpen={todaysModalOpen}
        expenses={expenses}
        categories={categories}
        lang={lang}
        onClose={() => setTodaysModalOpen(false)}
        onAddTodayExpense={() => openAddExpenseModal(getTodayDateString())}
        onEditExpense={openEditExpenseModal}
        onDeleteExpense={handleDeleteExpense}
      />

      <QuickBudgetModal
        isOpen={quickBudgetModalOpen}
        currentBudget={settings.monthlyBudget}
        lang={lang}
        onClose={() => setQuickBudgetModalOpen(false)}
        onSaveBudget={(budget) => {
          handleUpdateSettings({ monthlyBudget: budget });
          setToast({ message: t.budgetSaved });
        }}
      />

      {/* Toast Notification with Undo */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:w-auto z-50 flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-sm font-medium shadow-lg"
        >
          <span>{toast.message}</span>
          {toast.undoExpense && (
            <button
              type="button"
              onClick={handleUndoDelete}
              className="text-emerald-400 hover:text-emerald-300 font-semibold whitespace-nowrap"
            >
              {lang === 'bn' ? 'ফিরিয়ে আনুন' : 'Undo'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
