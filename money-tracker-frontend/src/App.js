import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Papa from 'papaparse'; 
import { 
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import './App.css';

function App() {
  const [transactions, setTransactions] = useState([]);
  const [text, setText] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('debit');
  const [category, setCategory] = useState('Food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await axios.get('https://money-tracker-api-8jk8.onrender.com/transactions');
      setTransactions(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const addTransaction = async (e) => {
    e.preventDefault();
    const newTransaction = { text, amount: Number(amount), type, category, date };
    await axios.post('https://money-tracker-api-8jk8.onrender.com/transactions', newTransaction);
    setText(''); setAmount(''); fetchTransactions();
  };

  // --- NEW: Clear All Data Function ---
  const clearData = async () => {
    if (window.confirm("Are you sure you want to delete ALL data? This cannot be undone.")) {
      try {
        await axios.delete('https://money-tracker-api-8jk8.onrender.com/transactions');
        fetchTransactions(); // Refresh list to show empty
        alert("All transactions deleted successfully!");
      } catch (error) {
        console.error("Error clearing data:", error);
        alert("Failed to delete data.");
      }
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true, 
      skipEmptyLines: true,
      complete: async (results) => {
        const importedData = results.data.map(row => ({
          text: row.Description || row.description || "Imported Txn",
          amount: Number(row.Amount || row.amount || 0),
          type: (row.Type || row.type || 'debit').toLowerCase(),
          category: row.Category || row.category || 'Uncategorized',
          date: row.Date ? new Date(row.Date) : new Date()
        }));

        try {
          await axios.post('https://money-tracker-api-8jk8.onrender.com/transactions/bulk', importedData);
          alert(`Successfully imported ${importedData.length} transactions!`);
          fetchTransactions(); 
        } catch (error) {
          console.error("Import Error:", error);
          alert("Error importing file. Check console.");
        }
      }
    });
  };

  // --- CALCULATIONS ---
  const income = transactions.filter(t => t.type === 'credit').reduce((acc, t) => acc + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'debit').reduce((acc, t) => acc + t.amount, 0);
  const balance = income - expense;

  const expenseTransactions = transactions.filter(t => t.type === 'debit');
  const chartData = Object.values(expenseTransactions.reduce((acc, curr) => {
    if (!acc[curr.category]) acc[curr.category] = { name: curr.category, value: 0 };
    acc[curr.category].value += curr.amount;
    return acc;
  }, {}));

  const dailyData = Object.values(expenseTransactions.reduce((acc, curr) => {
    const dateStr = new Date(curr.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!acc[dateStr]) acc[dateStr] = { date: dateStr, amount: 0, rawDate: new Date(curr.date) };
    acc[dateStr].amount += curr.amount;
    return acc;
  }, {})).sort((a, b) => a.rawDate - b.rawDate);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

  return (
    <div className="App">
      <h1>Money Tracker 💸</h1>
      
      <div className="summary-container">
        <div className="card balance"><h3>Balance</h3><h1>₹{balance}</h1></div>
        <div className="card income"><h3>Income</h3><h1 style={{color: 'green'}}>+₹{income}</h1></div>
        <div className="card expense"><h3>Expense</h3><h1 style={{color: 'red'}}>-₹{expense}</h1></div>
      </div>

      <div style={{display: 'flex', gap: '20px', flexWrap: 'wrap'}}>
        {chartData.length > 0 && (
          <div className="chart-container" style={{flex: 1, minWidth: '300px'}}>
              <h3>Category Split</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label>
                    {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
          </div>
        )}

        {dailyData.length > 0 && (
           <div className="chart-container" style={{flex: 1, minWidth: '300px'}}>
            <h3>Daily Expenses</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip /><Bar dataKey="amount" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="upload-section" style={{background: '#fff', padding: '20px', marginTop: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)'}}>
        <h3>📥 Import from CSV</h3>
        <p>Upload a CSV file with columns: <b>Date, Description, Amount, Type, Category</b></p>
        <input type="file" accept=".csv" onChange={handleFileUpload} />
      </div>

      <form onSubmit={addTransaction} className="transaction-form">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        <input type="text" placeholder="Description" value={text} onChange={(e) => setText(e.target.value)} required />
        <input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="Food">Food</option>
          <option value="Travel">Travel</option>
          <option value="Shopping">Shopping</option>
          <option value="Bills">Bills</option>
          <option value="Salary">Salary/Income</option>
        </select>

        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="debit">Expense</option>
          <option value="credit">Income</option>
        </select>
        <button type="submit">Add Transaction</button>
      </form>

      {/* LIST HEADER WITH CLEAR BUTTON */}
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '30px'}}>
        <h3>History</h3>
        <button 
          onClick={clearData} 
          style={{
            backgroundColor: '#ff4d4d', 
            color: 'white', 
            padding: '8px 12px', 
            border: 'none', 
            borderRadius: '5px', 
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          🗑️ Clear All
        </button>
      </div>

      <div className="transaction-list">
        {transactions.map((t) => (
          <div key={t._id} className={`transaction-item ${t.type}`}>
            <span className="category-tag">{t.category}</span>
            <div style={{display:'flex', flexDirection:'column', alignItems:'flex-start'}}>
                <span>{t.text}</span>
                <span style={{fontSize: '0.8rem', color: '#777'}}>{new Date(t.date).toLocaleDateString()}</span>
            </div>
            <span>{t.type === 'credit' ? '+' : '-'} ₹{t.amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;