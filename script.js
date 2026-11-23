
/* =================================
   Expense Tracker
   Commit 1: Application Foundation
================================= */

// Transaction data will be stored in this JavaScript array.
let transactions = [];

// Monthly budget.
let monthlyBudget = 0;

// ID generator for transactions.
let nextId = 1;


// =================================
// Categories
// =================================

const expenseCategories = [
    "Food",
    "Transport",
    "Education",
    "Housing",
    "Health",
    "Entertainment",
    "Shopping",
    "Utilities",
    "Business",
    "Other"
];

const incomeCategories = [
    "Salary",
    "Business",
    "Freelance",
    "Investment",
    "Gift",
    "Other"
];


// =================================
// DOM Helper
// =================================

const $ = (id) => document.getElementById(id);


// =================================
// Formatting
// =================================

function money(amount) {
    return "$" + Number(amount || 0).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}


// =================================
// Date Initialization
// =================================

function setTodayDate() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    $("date").value = `${year}-${month}-${day}`;
}


// =================================
// Category Initialization
// =================================

function populateCategories() {
    const type = $("type").value;

    const categories = type === "income"
        ? incomeCategories
        : expenseCategories;

    $("category").innerHTML = categories
        .map(category => `
            <option value="${category}">
                ${category}
            </option>
        `)
        .join("");
}


// =================================
// Initial Application Setup
// =================================

function initializeApp() {
    setTodayDate();
    populateCategories();

    $("type").addEventListener("change", populateCategories);

    console.log("Expense Tracker initialized.");
}


// =================================
// Start Application
// =================================

initializeApp();
