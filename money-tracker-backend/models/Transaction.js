const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    text: { type: String, required: true },       // e.g., "Salary", "Burger King"
    amount: { type: Number, required: true },     // e.g., 5000, 250
    type: { type: String, required: true },       // "credit" (income) or "debit" (expense)
    category: { type: String, default: 'Others'}, // e.g., "Food", "Rent"
    date: { type: Date, default: Date.now }       // Auto-adds today's date
});

module.exports = mongoose.model('Transaction', TransactionSchema);