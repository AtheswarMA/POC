import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { LogOut, PlusCircle, IndianRupee, PieChart as PieChartIcon, LogIn, Trash2, Edit2 } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const CATEGORIES = [
  "Department Store & Supermarket",
  "Apparel",
  "Dining",
  "Motoring",
  "Medical",
  "Others"
];

function App() {
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('username'));
  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [expenses, setExpenses] = useState([]);
  const [budget, setBudget] = useState(0);
  
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState(CATEGORIES[0]);
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingId, setEditingId] = useState(null);
  const [selectedMonthFilter, setSelectedMonthFilter] = useState(null);
  
  const [budgetInput, setBudgetInput] = useState('');

  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
    }
  }, [isLoggedIn]);

  const fetchData = async () => {
    try {
      const expRes = await axios.get(`${API_URL}/expenses?username=${username}`);
      setExpenses(expRes.data);
      const budRes = await axios.get(`${API_URL}/budget?username=${username}`);
      setBudget(budRes.data.monthly_budget);
      setBudgetInput(budRes.data.monthly_budget);
    } catch (err) {
      console.error(err);
      alert("Uh oh! Could not connect to the Backend Server. Please make sure your Python terminal is running (uvicorn main:app --reload)");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginInput.trim() || !passwordInput.trim()) return;
    try {
      await axios.post(`${API_URL}/login`, { username: loginInput, password: passwordInput });
      localStorage.setItem('username', loginInput);
      setUsername(loginInput);
      setIsLoggedIn(true);
      setLoginError('');
      setLoginInput('');
      setPasswordInput('');
    } catch (err) {
      console.error(err);
      if (err.message === 'Network Error' || !err.response) {
        setLoginError('Server unreachable. Is your backend running?');
      } else {
        setLoginError('Invalid credentials. Hint: use admin / admin123');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('username');
    setUsername('');
    setIsLoggedIn(false);
    setExpenses([]);
    setBudget(0);
  };

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    if (!expenseTitle || !expenseAmount) return;
    try {
      if (editingId) {
        await axios.put(`${API_URL}/expense/${editingId}`, {
          title: expenseTitle,
          amount: parseFloat(expenseAmount),
          category: expenseCategory,
          username,
          date: expenseDate
        });
        setEditingId(null);
      } else {
        await axios.post(`${API_URL}/add-expense`, {
          title: expenseTitle,
          amount: parseFloat(expenseAmount),
          category: expenseCategory,
          username,
          date: expenseDate
        });
      }
      setExpenseTitle('');
      setExpenseAmount('');
      setExpenseCategory(CATEGORIES[0]);
      setExpenseDate(new Date().toISOString().split('T')[0]);
      fetchData();
      alert(editingId ? "Expense successfully updated!" : "New expense added!");
    } catch (err) {
      console.error(err);
      alert("Failed to save expense. Is the backend server running?");
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
    try {
      await axios.delete(`${API_URL}/expense/${id}`);
      fetchData();
      alert("Expense deleted.");
    } catch (err) {
      console.error(err);
      alert("Failed to delete expense.");
    }
  };

  const handleEditExpense = (exp) => {
    setEditingId(exp.id);
    setExpenseTitle(exp.title);
    setExpenseAmount(exp.amount);
    setExpenseCategory(exp.category);
    setExpenseDate(exp.date);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setExpenseTitle('');
    setExpenseAmount('');
    setExpenseCategory(CATEGORIES[0]);
    setExpenseDate(new Date().toISOString().split('T')[0]);
  };

  const handleSetBudget = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/set-budget`, {
        username,
        monthly_budget: parseFloat(budgetInput)
      });
      await fetchData();
      alert(`Budget successfully updated to ₹${parseFloat(budgetInput).toFixed(2)}!`);
    } catch (err) {
      console.error(err);
      alert("Failed to update budget. Please try again.");
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <div className="card login-card">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: 'var(--primary-color)' }}>
            <PieChartIcon size={48} />
          </div>
          <h1>Welcome Back</h1>
          <p>Sign in to manage your budget and expenses beautifully.</p>
          <div style={{ backgroundColor: 'rgba(79, 70, 229, 0.1)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <strong>Demo Id:</strong><br/>
            Username: <code>admin</code> &nbsp;|&nbsp; Password: <code>admin123</code>
          </div>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Username</label>
              <input 
                type="text" 
                placeholder="Enter your username" 
                value={loginInput} 
                onChange={(e) => setLoginInput(e.target.value)} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                placeholder="Enter your password" 
                value={passwordInput} 
                onChange={(e) => setPasswordInput(e.target.value)} 
                required 
              />
            </div>
            {loginError && <p style={{ color: 'var(--danger-color)', marginBottom: '1rem', fontSize: '0.9rem' }}>{loginError}</p>}
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>
              <LogIn size={20} style={{ marginRight: '0.5rem' }} /> Login securely
            </button>
          </form>
        </div>
      </div>
    );
  }

  const now = new Date();
  const months = [];
  for (let i = 2; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      label: d.toLocaleString('default', { month: 'short' }) + ' ' + d.getFullYear()
    });
  }

  const last3MonthsData = months.map(m => {
    const totalMonth = expenses.filter(exp => {
      if (!exp.date) return false;
      const d = new Date(exp.date);
      return d.getFullYear() === m.year && d.getMonth() === m.month;
    }).reduce((sum, exp) => sum + exp.amount, 0);
    return { ...m, total: totalMonth };
  });

  const handleMonthClick = (m) => {
    if (selectedMonthFilter && selectedMonthFilter.year === m.year && selectedMonthFilter.month === m.month) {
      setSelectedMonthFilter(null);
    } else {
      setSelectedMonthFilter(m);
    }
  };

  const filteredExpenses = selectedMonthFilter 
    ? expenses.filter(exp => {
        if (!exp.date) return false;
        const d = new Date(exp.date);
        return d.getFullYear() === selectedMonthFilter.year && d.getMonth() === selectedMonthFilter.month;
      })
    : expenses;

  const displayExpensesForStats = selectedMonthFilter 
    ? filteredExpenses 
    : expenses.filter(exp => {
        if (!exp.date) return false;
        const d = new Date(exp.date);
        return d.getFullYear() === new Date().getFullYear() && d.getMonth() === new Date().getMonth();
      });

  const totalExpenses = displayExpensesForStats.reduce((sum, exp) => sum + exp.amount, 0);
  const remainingBudget = budget - totalExpenses;

  const chartData = {
    labels: CATEGORIES,
    datasets: [
      {
        data: CATEGORIES.map(cat => filteredExpenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0)),
        backgroundColor: [
          '#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'
        ],
        borderWidth: 0,
      },
    ],
  };

  return (
    <>
      <header className="glass-header">
        <div className="container" style={{ margin: '0 auto' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)' }}>
            <PieChartIcon /> SpendSync
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontWeight: '500' }}>Hello, {username}!</span>
            <button onClick={handleLogout} className="btn" style={{ background: 'var(--border-color)' }}>
              <LogOut size={16} style={{ marginRight: '0.5rem' }} /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="container">
        <div className="dashboard-grid">
          <div className="stat-card">
            <h3>Monthly Budget</h3>
            <div className="value" style={{ display: 'flex', alignItems: 'center' }}>
              <IndianRupee size={28} /> {parseFloat(budget || 0).toFixed(2)}
            </div>
            <br/>
            <form onSubmit={handleSetBudget} style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="number" 
                value={budgetInput} 
                onChange={(e) => setBudgetInput(e.target.value)} 
                placeholder="Set Budget"
                style={{ padding: '0.5rem' }}
                required 
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>Set</button>
            </form>
          </div>
          
          <div className="stat-card">
            <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              Total Expenses {selectedMonthFilter ? <span className="badge" style={{ fontSize: '0.7rem', padding: '0.1rem 0.5rem' }}>{selectedMonthFilter.label}</span> : <span className="badge" style={{ fontSize: '0.7rem', padding: '0.1rem 0.5rem' }}>This Month</span>}
            </h3>
            <div className="value" style={{ display: 'flex', alignItems: 'center', color: 'var(--danger-color)' }}>
              <IndianRupee size={28} /> {totalExpenses.toFixed(2)}
            </div>
          </div>
          
          <div className="stat-card primary">
            <h3>Remaining Balance</h3>
            <div className="value" style={{ display: 'flex', alignItems: 'center' }}>
              <IndianRupee size={28} /> {remainingBudget.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PieChartIcon /> Last 3 Months Analysis
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {last3MonthsData.map((m, idx) => {
              const isSelected = selectedMonthFilter && selectedMonthFilter.year === m.year && selectedMonthFilter.month === m.month;
              return (
                <div 
                  key={idx} 
                  onClick={() => handleMonthClick(m)}
                  style={{ 
                    background: isSelected ? 'var(--primary-color)' : 'var(--bg-color)', 
                    padding: '1.5rem', 
                    borderRadius: 'var(--radius-md)', 
                    textAlign: 'center', 
                    border: isSelected ? '1px solid var(--primary-color)' : '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isSelected ? '0 10px 20px -5px rgba(79, 70, 229, 0.5)' : 'none',
                    transform: isSelected ? 'translateY(-4px)' : 'none'
                  }}>
                  <div style={{ color: isSelected ? 'rgba(255,255,255,0.9)' : 'var(--text-secondary)', fontWeight: '500', marginBottom: '0.5rem', transition: 'color 0.3s ease' }}>{m.label}</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: isSelected ? '#ffffff' : 'var(--primary-color)', transition: 'color 0.3s ease' }}>₹{m.total.toFixed(2)}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="main-content">
          <div>
            <div className="card" style={{ marginBottom: '2rem' }}>
              <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {editingId ? <Edit2 /> : <PlusCircle />} {editingId ? 'Edit Expense' : 'Add New Expense'}
              </h2>
              <form onSubmit={handleSaveExpense} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label>Title</label>
                  <input type="text" value={expenseTitle} onChange={(e) => setExpenseTitle(e.target.value)} required placeholder="e.g. Groceries" />
                </div>
                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label>Amount</label>
                  <input type="number" step="0.01" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} required placeholder="0.00" />
                </div>
                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label>Date</label>
                  <input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} required />
                </div>
                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label>Category</label>
                  <select value={expenseCategory} onChange={(e) => setExpenseCategory(e.target.value)}>
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingId ? 'Update Expense' : 'Add Expense'}</button>
                  {editingId && <button type="button" className="btn" onClick={cancelEdit} style={{ flex: 1, backgroundColor: 'var(--border-color)', color: 'var(--text-primary)' }}>Cancel</button>}
                </div>
              </form>
            </div>

            <div className="card">
              <h2 style={{ marginBottom: '1rem' }}>
                {selectedMonthFilter ? `${selectedMonthFilter.label} Expenses` : `All Recent Expenses`}
              </h2>
              {filteredExpenses.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>No expenses found for this selection.</p>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Amount</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredExpenses.slice().reverse().map((exp) => (
                        <tr key={exp.id}>
                          <td style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{exp.date}</td>
                          <td style={{ fontWeight: '500' }}>{exp.title}</td>
                          <td><span className="badge">{exp.category}</span></td>
                          <td style={{ fontWeight: '600' }}>₹{exp.amount.toFixed(2)}</td>
                          <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <button onClick={() => handleEditExpense(exp)} className="btn" style={{ padding: '0.2rem 0.5rem', marginRight: '0.5rem', background: 'transparent', color: 'var(--primary-color)' }}><Edit2 size={16}/></button>
                            <button onClick={() => handleDeleteExpense(exp.id)} className="btn" style={{ padding: '0.2rem 0.5rem', background: 'transparent', color: 'var(--danger-color)' }}><Trash2 size={16}/></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Expenses by Category</h2>
            {filteredExpenses.length > 0 ? (
              <Pie data={chartData} />
            ) : (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No chart data for this period.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
