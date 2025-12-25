const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import the Blueprint we just created
const Transaction = require('./models/Transaction');

const app = express();
app.use(express.json()); // Allows the server to read JSON data
app.use(cors());

// --- DATABASE CONNECTION ---
// (Keep your existing link here!)
const MONGO_URI = 'mongodb+srv://kunal:money12345@moneytracker.lksz9sn.mongodb.net/?appName=MoneyTracker';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to Cloud Database'))
  .catch(err => console.error('❌ Connection Error:', err));

// --- ROUTES (The API Endpoints) ---

// 1. GET: Show all transactions
app.get('/transactions', async (req, res) => {
    try {
        const allTransactions = await Transaction.find(); // Fetch everything from DB
        res.json(allTransactions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. POST: Add a new transaction
app.post('/transactions', async (req, res) => {
    try {
        // Create a new transaction using the data sent from Frontend/App
        const newTransaction = new Transaction({
            text: req.body.text,
            amount: req.body.amount,
            type: req.body.type,
            category: req.body.category,
            date: req.body.date

        });
        
        // Save it to the cloud
        const savedTransaction = await newTransaction.save();
        res.json(savedTransaction);
        console.log("💰 New Transaction Saved:", savedTransaction);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. POST: Bulk Add (For CSV Upload)
app.post('/transactions/bulk', async (req, res) => {
    try {
        // req.body should be an ARRAY of transactions
        const savedTransactions = await Transaction.insertMany(req.body);
        res.json(savedTransactions);
        console.log(`💰 Imported ${savedTransactions.length} transactions!`);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. DELETE: Clear all transactions
app.delete('/transactions', async (req, res) => {
    try {
        await Transaction.deleteMany({});
        res.json({ message: "All transactions deleted" });
        console.log("🔥 All data wiped!");
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start Server
app.listen(5000, () => {
    console.log('Server is running on port 5000');
});