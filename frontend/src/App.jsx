import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import CreateGroup from './pages/CreateGroup';
import JoinGroup from './pages/JoinGroup';
import GroupDashboard from './pages/GroupDashboard';
import ExpenseHistory from './pages/ExpenseHistory';
import AddEditExpense from './pages/AddEditExpense';
import MembersList from './pages/MembersList';
import SettleUp from './pages/SettleUp';
import Login from './pages/Login';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-canvas-parchment">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreateGroup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/join/:code" element={<JoinGroup />} />
          <Route path="/trip/:code" element={<GroupDashboard />} />
          <Route path="/trip/:code/history" element={<ExpenseHistory />} />
          <Route path="/trip/:code/expense/new" element={<AddEditExpense />} />
          <Route path="/trip/:code/expense/:id/edit" element={<AddEditExpense />} />
          <Route path="/trip/:code/members" element={<MembersList />} />
          <Route path="/trip/:code/settle" element={<SettleUp />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
