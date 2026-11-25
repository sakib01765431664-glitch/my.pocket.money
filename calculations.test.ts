import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from '../constants/defaults';
import type { Expense } from '../types/expense';
import {
  buildExpensesCsv,
  computeBudgetSummary,
  computeCategoryBreakdown,
  computeDashboardMetrics,
  computeMonthlyComparison,
  computeMonthlyIncomeTotal,
  computeMonthlyReport,
  computeWeeklyReport,
  createBackupPayload,
  filterExpenses,
  groupExpensesByDate,
  parseAndValidateBackup,
} from './calculations';

function makeExpense(overrides: Partial<Expense>): Expense {
  return {
    id: overrides.id ?? 'e1',
    amount: overrides.amount ?? 100,
    categoryId: overrides.categoryId ?? 'cat_food',
    description: overrides.description ?? 'Lunch',
    date: overrides.date ?? '2026-11-25',
    time: overrides.time ?? '13:00',
    createdAt: overrides.createdAt ?? 1000,
    updatedAt: overrides.updatedAt ?? 1000,
  };
}

test('computeDashboardMetrics accurately totals today, week, month, daily avg, and MoM change', () => {
  const now = new Date(2026, 10, 25, 10, 0, 0); // Nov 25, 2026 (Wed)
  const expenses: Expense[] = [
    // Today (Nov 25): 60 + 20 + 100 = 180
    makeExpense({ id: '1', amount: 60, date: '2026-11-25', time: '08:30' }),
    makeExpense({ id: '2', amount: 20, date: '2026-11-25', time: '13:15' }),
    makeExpense({ id: '3', amount: 100, date: '2026-11-25', time: '17:45' }),
    // Same week (Sun Nov 22 - Sat Nov 28): Nov 23 = 320
    makeExpense({ id: '4', amount: 320, date: '2026-11-23', time: '11:00' }),
    // Earlier this month: Nov 05 = 500
    makeExpense({ id: '5', amount: 500, date: '2026-11-05', time: '19:00' }),
    // Last month (Oct): 800
    makeExpense({ id: '6', amount: 800, date: '2026-10-15', time: '12:00' }),
  ];

  const metrics = computeDashboardMetrics(expenses, now);
  assert.equal(metrics.todayTotal, 180);
  assert.equal(metrics.weekTotal, 500);
  assert.equal(metrics.monthTotal, 1000);
  assert.equal(metrics.entryCount, 5);
  assert.equal(metrics.dailyAverage, 1000 / 25);
  assert.equal(metrics.lastMonthTotal, 800);
  assert.equal(metrics.monthDiffAmount, 200);
  assert.equal(metrics.monthDiffPercent, 25);
  assert.equal(metrics.calculatedUpToDay, 25);
});

test('computeBudgetSummary handles unset, normal, warning (>=80%), and exceeded (>=100%)', () => {
  assert.equal(computeBudgetSummary(500, 0).status, 'unset');
  assert.equal(computeBudgetSummary(3999, 5000).status, 'normal');

  const warn = computeBudgetSummary(4000, 5000);
  assert.equal(warn.status, 'warning');
  assert.equal(warn.percentUsed, 80);
  assert.equal(warn.remaining, 1000);

  const exceeded = computeBudgetSummary(5500, 5000);
  assert.equal(exceeded.status, 'exceeded');
  assert.equal(exceeded.percentUsed, 110);
  assert.equal(exceeded.remaining, -500);
});

test('computeWeeklyReport identifies highest/lowest weeks and daily average', () => {
  const now = new Date(2026, 10, 25, 10, 0, 0);
  const expenses: Expense[] = [
    makeExpense({ id: '1', amount: 700, date: '2026-11-02' }), // Week 1
    makeExpense({ id: '2', amount: 1400, date: '2026-11-10' }), // Week 2
    makeExpense({ id: '3', amount: 350, date: '2026-11-18' }), // Week 3
    makeExpense({ id: '4', amount: 550, date: '2026-11-24' }), // Week 4
  ];

  const report = computeWeeklyReport(expenses, '2026-11', now);
  assert.equal(report.weeks.length, 5); // Nov has 30 days -> 5 buckets (29-30)
  assert.equal(report.highestWeek?.weekIndex, 2);
  assert.equal(report.highestWeek?.total, 1400);
  assert.equal(report.lowestWeek?.weekIndex, 3);
  assert.equal(report.lowestWeek?.total, 350);
  assert.equal(report.overallWeeklyDailyAvg, 3000 / 30);
});

test('computeMonthlyReport and computeCategoryBreakdown calculate day extremes and percentages', () => {
  const now = new Date(2026, 10, 25, 10, 0, 0);
  const expenses: Expense[] = [
    makeExpense({ id: '1', amount: 2000, categoryId: 'cat_food', date: '2026-11-02' }),
    makeExpense({ id: '2', amount: 1000, categoryId: 'cat_transport', date: '2026-11-10' }),
    makeExpense({ id: '3', amount: 500, categoryId: 'cat_tea', date: '2026-11-10' }),
    makeExpense({ id: '4', amount: 300, categoryId: 'cat_entertainment', date: '2026-11-20' }),
  ];

  const report = computeMonthlyReport(expenses, DEFAULT_CATEGORIES, '2026-11', now);
  assert.equal(report.total, 3800);
  assert.equal(report.entryCount, 4);
  assert.equal(report.highestDay?.date, '2026-11-02');
  assert.equal(report.highestDay?.total, 2000);
  assert.equal(report.lowestDay?.date, '2026-11-20');
  assert.equal(report.lowestDay?.total, 300);

  const breakdown = computeCategoryBreakdown(expenses, DEFAULT_CATEGORIES);
  assert.equal(breakdown[0].categoryId, 'cat_food');
  assert.ok(Math.abs(breakdown[0].percentage - (2000 / 3800) * 100) < 0.001);
});

test('computeMonthlyComparison compares multi-month totals and deltas', () => {
  const expenses: Expense[] = [
    makeExpense({ id: '1', amount: 5000, date: '2026-09-12' }),
    makeExpense({ id: '2', amount: 6000, date: '2026-10-14' }),
    makeExpense({ id: '3', amount: 4000, date: '2026-11-08' }),
  ];
  const comp = computeMonthlyComparison(expenses, ['2026-09', '2026-10', '2026-11']);
  assert.equal(comp.highestMonth?.monthKey, '2026-10');
  assert.equal(comp.lowestMonth?.monthKey, '2026-11');
  assert.equal(comp.items[1].diffAmount, 1000);
  assert.equal(comp.items[1].diffPercent, 20);
  assert.equal(comp.items[2].diffAmount, -2000);
  assert.ok(Math.abs((comp.items[2].diffPercent ?? 0) - -33.3333) < 0.01);
});

test('filterExpenses and groupExpensesByDate handle search, date, month, category, and amount range', () => {
  const expenses: Expense[] = [
    makeExpense({ id: '1', amount: 60, categoryId: 'cat_tea', description: 'Cha', date: '2026-11-25', time: '09:00' }),
    makeExpense({ id: '2', amount: 250, categoryId: 'cat_food', description: 'Biriyani', date: '2026-11-25', time: '14:00' }),
    makeExpense({ id: '3', amount: 120, categoryId: 'cat_transport', description: 'Bus', date: '2026-10-20', time: '10:00' }),
  ];

  const filtered = filterExpenses(expenses, DEFAULT_CATEGORIES, {
    searchQuery: '',
    date: '',
    month: '2026-11',
    categoryId: '',
    minAmount: '100',
    maxAmount: '300',
  });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, '2');

  const grouped = groupExpensesByDate(expenses);
  assert.equal(grouped[0].date, '2026-11-25');
  assert.equal(grouped[0].total, 310);
  assert.equal(grouped[0].entries[0].id, '2'); // newer time first
});

test('CSV export and JSON backup/restore round-trip cleanly', () => {
  const expenses: Expense[] = [
    makeExpense({ id: '1', amount: 120, description: 'Tea, snacks "special"', date: '2026-11-25' }),
  ];
  const csv = buildExpensesCsv(expenses, DEFAULT_CATEGORIES, 'en');
  assert.ok(csv.startsWith('\uFEFFDate,Time,Category,Description,Amount (BDT)'));
  assert.ok(csv.includes('"Tea, snacks ""special"""'));

  const payload = createBackupPayload(expenses, DEFAULT_CATEGORIES, DEFAULT_SETTINGS, [
    {
      id: 'inc1',
      amount: 3000,
      source: 'Allowance',
      note: 'Monthly pocket money',
      date: '2026-11-01',
      time: '10:00',
      createdAt: 1000,
      updatedAt: 1000,
    },
  ]);
  const restored = parseAndValidateBackup(JSON.stringify(payload));
  assert.ok(restored !== null);
  assert.equal(restored.expenses.length, 1);
  assert.equal(restored.expenses[0].amount, 120);
  assert.equal(restored.incomes?.length, 1);
  assert.equal(restored.incomes?.[0].amount, 3000);
  assert.equal(parseAndValidateBackup('{invalid'), null);
});

test('computeMonthlyIncomeTotal sums only incomes in the target month', () => {
  const total = computeMonthlyIncomeTotal(
    [
      {
        id: 'i1',
        amount: 2000,
        source: 'Pocket Money',
        note: '',
        date: '2026-11-01',
        time: '09:00',
        createdAt: 1,
        updatedAt: 1,
      },
      {
        id: 'i2',
        amount: 1500,
        source: 'Tuition',
        note: '',
        date: '2026-11-15',
        time: '18:00',
        createdAt: 2,
        updatedAt: 2,
      },
      {
        id: 'i3',
        amount: 5000,
        source: 'Salary',
        note: '',
        date: '2026-10-30',
        time: '10:00',
        createdAt: 3,
        updatedAt: 3,
      },
    ],
    '2026-11'
  );
  assert.equal(total, 3500);
});
