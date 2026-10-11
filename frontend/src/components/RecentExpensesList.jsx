import { Link } from 'react-router-dom';
import { Plus, Receipt } from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/formatters';
import CategoryIcon from './CategoryIcon';

export default function RecentExpensesList({ expenses = [], members = [], code, limit = 5 }) {
  const getMemberName = (id) => {
    const m = members?.find((m) => m._id === id);
    return m?.name || 'Unknown';
  };

  const displayExpenses = expenses.slice(0, limit);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 m-0">Recent Expenses</h3>
          <Link
            to={`/trip/${code}/history`}
            className="text-xs font-semibold text-[#0071e3] hover:underline no-underline"
          >
            View All
          </Link>
        </div>

        {/* Expenses List */}
        {!displayExpenses.length ? (
          <div className="py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2 text-gray-400">
              <Receipt size={22} />
            </div>
            <p className="text-xs text-gray-400 m-0">No expenses recorded yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {displayExpenses.map((expense) => {
              const categoryLabel = (expense.category || 'misc').replace('_', ' ');

              return (
                <Link
                  key={expense._id}
                  to={`/trip/${code}/expense/${expense._id}/edit`}
                  className="flex items-start justify-between py-3.5 first:pt-4 last:pb-1 no-underline group hover:bg-gray-50/50 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div className="min-w-0 pr-3">
                    <h4 className="text-sm font-bold text-gray-900 group-hover:text-[#0071e3] transition-colors m-0 truncate">
                      {expense.description}
                    </h4>
                    <p className="text-xs text-gray-400 font-normal m-0 mt-0.5">
                      Paid by {getMemberName(expense.paidByMemberId)} · {formatDate(expense.date)}
                    </p>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 px-2 py-0.5 rounded inline-flex items-center gap-1 mt-1.5">
                      <CategoryIcon category={expense.category} size={11} className="text-gray-500" />
                      <span>{categoryLabel}</span>
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm sm:text-base font-bold text-gray-900">
                      {formatCurrency(expense.amountPaise).replace('.00', '')}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Large + Add Expense CTA Button */}
      <Link
        to={`/trip/${code}/expense/new`}
        className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-sm font-semibold shadow-xs transition-all hover:shadow-md active:scale-[0.99] no-underline"
      >
        <Plus size={16} />
        <span>Add Expense</span>
      </Link>
    </div>
  );
}
