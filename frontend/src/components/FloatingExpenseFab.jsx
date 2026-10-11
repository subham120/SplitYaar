import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

export default function FloatingExpenseFab({ code }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
      <Link
        to={`/trip/${code}/expense/new`}
        className="btn-primary shadow-lg px-6 py-3.5 text-base"
        style={{
          boxShadow: '0 8px 24px rgba(0, 102, 204, 0.35), 0 2px 8px rgba(0, 0, 0, 0.08)',
        }}
      >
        <Plus size={18} strokeWidth={2.5} />
        Add Expense
      </Link>
    </div>
  );
}
