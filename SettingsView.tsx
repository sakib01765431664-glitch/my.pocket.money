import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Download,
  FileSpreadsheet,
  FolderCog,
  GraduationCap,
  Languages,
  Moon,
  ShieldCheck,
  Sun,
  Trash2,
  Upload,
  UserRound,
  Wallet,
} from 'lucide-react';
import type { AppSettings, Language, ThemeMode } from '../types/expense';
import { TEXT } from '../utils/i18n';

interface SettingsViewProps {
  settings: AppSettings;
  expenseCount: number;
  categoryCount: number;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
  onOpenCategoryManager: () => void;
  onExportJson: () => void;
  onImportJson: (fileText: string) => boolean;
  onExportCsv: () => void;
  onDeleteAllExpenses: () => void;
}

export function SettingsView({
  settings,
  expenseCount,
  categoryCount,
  onUpdateSettings,
  onOpenCategoryManager,
  onExportJson,
  onImportJson,
  onExportCsv,
  onDeleteAllExpenses,
}: SettingsViewProps) {
  const lang = settings.language;
  const t = TEXT[lang];

  const [budgetInput, setBudgetInput] = useState(String(settings.monthlyBudget || ''));
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setBudgetInput(String(settings.monthlyBudget || ''));
  }, [settings.monthlyBudget]);

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(budgetInput);
    if (!Number.isFinite(val) || val < 0) return;
    onUpdateSettings({ monthlyBudget: Math.round(val) });
    setStatusMessage({ type: 'success', text: t.budgetSaved });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const ok = onImportJson(text);
      setStatusMessage({
        type: ok ? 'success' : 'error',
        text: ok ? t.restoreSuccess : t.restoreError,
      });
    } catch {
      setStatusMessage({ type: 'error', text: t.restoreError });
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
        {t.settingsTitle}
      </h1>

      {statusMessage && (
        <div
          role="status"
          className={`px-4 py-3 rounded-xl border text-sm font-medium ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* Language & Theme */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-5">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {t.appearanceSection}
        </h2>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5 text-sm font-medium text-slate-700 dark:text-slate-200">
            <Languages className="w-4 h-4 text-slate-400" aria-hidden="true" />
            <span>{t.languageLabel}</span>
          </div>
          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 self-start sm:self-auto">
            {(['bn', 'en'] as Language[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => onUpdateSettings({ language: l })}
                aria-pressed={settings.language === l}
                className={`min-h-[38px] px-4 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  settings.language === l
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {l === 'bn' ? 'বাংলা' : 'English'}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5 text-sm font-medium text-slate-700 dark:text-slate-200">
            {settings.theme === 'dark' ? (
              <Moon className="w-4 h-4 text-slate-400" aria-hidden="true" />
            ) : (
              <Sun className="w-4 h-4 text-slate-400" aria-hidden="true" />
            )}
            <span>{t.themeLabel}</span>
          </div>
          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 self-start sm:self-auto">
            {(['light', 'dark'] as ThemeMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onUpdateSettings({ theme: mode })}
                aria-pressed={settings.theme === mode}
                className={`min-h-[38px] px-4 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  settings.theme === mode
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {mode === 'light' ? (
                  <Sun className="w-3.5 h-3.5" aria-hidden="true" />
                ) : (
                  <Moon className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                <span>{mode === 'light' ? t.lightMode : t.darkMode}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Monthly Budget */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2.5">
          <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {t.budgetSection}
          </h2>
        </div>

        <form onSubmit={handleSaveBudget} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono-num font-bold text-slate-400">
              ৳
            </span>
            <input
              type="number"
              min="0"
              aria-label={t.budgetSection}
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              placeholder="5000"
              className="w-full h-11 pl-9 pr-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono-num text-sm font-semibold text-slate-900 dark:text-slate-100"
            />
          </div>
          <button
            type="submit"
            className="min-h-[44px] px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold whitespace-nowrap shrink-0 transition-colors"
          >
            {t.saveBudget}
          </button>
        </form>
      </section>

      {/* Category Manager */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <FolderCog className="w-5 h-5 text-slate-400 shrink-0" aria-hidden="true" />
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {t.manageCategories}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {lang === 'bn'
                ? `${categoryCount} টি ক্যাটাগরি সক্রিয় আছে`
                : `${categoryCount} active categories`}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenCategoryManager}
          className="min-h-[42px] px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap shrink-0"
        >
          {t.edit}
        </button>
      </section>

      {/* Data Management (Backup, Restore, CSV Export, Delete All) */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {t.dataSection}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={onExportJson}
            className="min-h-[46px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <span>{t.backupJson}</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="min-h-[46px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-2 transition-colors"
          >
            <Upload className="w-4 h-4 text-sky-600 dark:text-sky-400" aria-hidden="true" />
            <span>{t.restoreJson}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={onExportCsv}
            className="min-h-[46px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-2 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            <span>{t.exportCsv}</span>
          </button>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{t.localPrivacyNote}</span>
          </div>

          <button
            type="button"
            disabled={expenseCount === 0}
            onClick={() => setConfirmDeleteOpen(true)}
            className="min-h-[42px] px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-950/70 disabled:opacity-45 disabled:pointer-events-none text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
            <span>{t.deleteAllBtn}</span>
          </button>
        </div>
      </section>

      {/* আমার সম্পর্কে (About) */}
      <section
        aria-label="আমার সম্পর্কে"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4"
      >
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0">
            <UserRound className="w-5 h-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              আমার সম্পর্কে
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              পরিচিতি ও ব্যক্তিগত উদ্যোগ
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2.5">
            <UserRound className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400">আমার নাম</p>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                আল সাকিব
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2.5">
            <GraduationCap className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400">শিক্ষাপ্রতিষ্ঠান</p>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                ঢাকা সেন্ট্রাল ইউনিভার্সিটি
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2.5">
            <BookOpen className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400">বিভাগ</p>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                বাংলা বিভাগ
              </p>
            </div>
          </div>
        </div>

        <blockquote className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/25 border border-emerald-200/80 dark:border-emerald-900/60 text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
          “আমি আল সাকিব। নিজের দৈনন্দিন কাজ ও খরচের হিসাব সহজে পরিচালনা করার জন্য এই অ্যাপটি নিজেই তৈরি করেছি। এটি আমার ব্যক্তিগত একটি উদ্যোগ।”
        </blockquote>
      </section>

      {/* Delete All Confirmation Modal */}
      {confirmDeleteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmDeleteOpen(false);
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-all-title"
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" aria-hidden="true" />
              <h3 id="delete-all-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {t.deleteAllConfirmTitle}
              </h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {t.deleteAllConfirmDesc}
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteOpen(false)}
                className="min-h-[42px] px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteAllExpenses();
                  setConfirmDeleteOpen(false);
                }}
                className="min-h-[42px] px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold"
              >
                {t.confirmDeleteAll}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
