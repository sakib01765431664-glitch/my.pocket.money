import { useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { CATEGORY_COLOR_PALETTE, CATEGORY_ICON_OPTIONS } from '../constants/defaults';
import type { Category, CategoryIconKey, Language } from '../types/expense';
import { TEXT, getCategoryName } from '../utils/i18n';
import { CategoryIcon } from './CategoryIcon';

interface CategoryManagerModalProps {
  isOpen: boolean;
  categories: Category[];
  lang: Language;
  onClose: () => void;
  onSaveCategory: (cat: Omit<Category, 'id'> & { id?: string }) => void;
  onDeleteCategory: (catId: string) => void;
}

export function CategoryManagerModal({
  isOpen,
  categories,
  lang,
  onClose,
  onSaveCategory,
  onDeleteCategory,
}: CategoryManagerModalProps) {
  const t = TEXT[lang];

  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameBn, setNameBn] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [color, setColor] = useState(CATEGORY_COLOR_PALETTE[0]);
  const [icon, setIcon] = useState<CategoryIconKey>('utensils');
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setEditingId(null);
    setNameBn('');
    setNameEn('');
    setColor(CATEGORY_COLOR_PALETTE[0]);
    setIcon('utensils');
    setFormError(null);
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setNameBn(cat.nameBn);
    setNameEn(cat.nameEn);
    setColor(cat.color);
    setIcon(cat.icon);
    setFormError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const bn = nameBn.trim();
    const en = nameEn.trim();
    if (!bn && !en) {
      setFormError(
        lang === 'bn'
          ? 'অন্তত বাংলা অথবা ইংরেজি নাম লিখুন।'
          : 'Please enter a Bangla or English category name.'
      );
      return;
    }
    onSaveCategory({
      id: editingId ?? undefined,
      nameBn: bn || en,
      nameEn: en || bn,
      color,
      icon,
    });
    resetForm();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 backdrop-blur-xs p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cat-manager-title"
        className="w-full sm:max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-5 py-4 flex items-center justify-between">
          <h2 id="cat-manager-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {t.manageCategories}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.cancel}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Add / Edit Form */}
          <form
            onSubmit={handleSubmit}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {editingId ? t.editCategoryTitle : t.addCategoryTitle}
              </h3>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  {t.cancel}
                </button>
              )}
            </div>

            {formError && (
              <p role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">
                {formError}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="cat-name-bn"
                  className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
                >
                  {t.catNameBn}
                </label>
                <input
                  id="cat-name-bn"
                  type="text"
                  value={nameBn}
                  onChange={(e) => setNameBn(e.target.value)}
                  placeholder="যেমন: বই ও স্টেশনারি"
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label
                  htmlFor="cat-name-en"
                  className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
                >
                  {t.catNameEn}
                </label>
                <input
                  id="cat-name-en"
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="e.g. Books & Stationery"
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Color Picker */}
            <div>
              <span className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                {t.catColor}
              </span>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_COLOR_PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    aria-label={`Color ${c}`}
                    aria-pressed={color === c}
                    className={`w-8 h-8 rounded-lg transition-transform ${
                      color === c ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white scale-110' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Icon Picker */}
            <div>
              <span className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                {t.catIcon}
              </span>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_ICON_OPTIONS.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setIcon(ic)}
                    aria-label={`Icon ${ic}`}
                    aria-pressed={icon === ic}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-colors ${
                      icon === ic
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <CategoryIcon icon={ic} className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 min-h-[42px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>{t.saveCategory}</span>
            </button>
          </form>

          {/* Existing Categories List */}
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              {t.deleteCategoryWarning}
            </p>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              {categories.map((cat) => {
                const displayName = getCategoryName(cat, lang);
                return (
                  <li
                    key={cat.id}
                    className="px-4 py-3 flex items-center justify-between gap-3 bg-white dark:bg-slate-900"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: cat.color }}
                      >
                        <CategoryIcon icon={cat.icon} className="w-4 h-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {cat.nameBn}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {cat.nameEn}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEdit(cat)}
                        aria-label={`${t.edit} ${displayName}`}
                        className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800"
                      >
                        <Pencil className="w-4 h-4" aria-hidden="true" />
                      </button>
                      {cat.id !== 'cat_other' && categories.length > 1 && (
                        <button
                          type="button"
                          onClick={() => onDeleteCategory(cat.id)}
                          aria-label={`${t.delete} ${displayName}`}
                          className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-950/40"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
