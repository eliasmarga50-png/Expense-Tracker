
let transactions = [];
let monthlyBudget = 0;
let nextId = 1;

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

const $ = id => document.getElementById(id);

function money(amount) {
    return "$" + Number(amount || 0).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function getToday() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function setTodayDate() {
    $("date").value = getToday();
}

function formatDate(dateString) {
    const date = new Date(dateString + "T00:00:00");

    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function populateCategories() {
    const type = $("type").value;
    const categories = type === "income" ? incomeCategories : expenseCategories;

    $("category").innerHTML = categories.map(category => `
        <option value="${escapeHTML(category)}">${escapeHTML(category)}</option>
    `).join("");
}

function updateCategoryFilter() {
    const selected = $("categoryFilter").value;

    const categories = [...new Set([
        ...expenseCategories,
        ...incomeCategories,
        ...transactions.map(transaction => transaction.category)
    ])];

    $("categoryFilter").innerHTML = `
        <option value="all">All Categories</option>
        ${categories.map(category => `
            <option value="${escapeHTML(category)}">${escapeHTML(category)}</option>
        `).join("")}
    `;

    if (categories.includes(selected)) {
        $("categoryFilter").value = selected;
    }
}

function addTransaction(event) {
    event.preventDefault();

    const description = $("description").value.trim();
    const amount = Number($("amount").value);
    const type = $("type").value;
    const category = $("category").value;
    const date = $("date").value;
    const paymentMethod = $("paymentMethod").value;
    const editingId = $("editingId").value;

    if (!description) {
        alert("Please enter a transaction description.");
        return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Please enter an amount greater than zero.");
        return;
    }

    if (!date) {
        alert("Please select a transaction date.");
        return;
    }

    const transactionData = {
        description,
        amount,
        type,
        category,
        date,
        paymentMethod
    };

    if (editingId !== "") {
        const transaction = transactions.find(
            item => item.id === Number(editingId)
        );

        if (transaction) {
            Object.assign(transaction, transactionData);
        }
    } else {
        transactions.push({
            id: nextId++,
            ...transactionData
        });
    }

    cancelEdit();

    updateCategoryFilter();
    renderTransactions();
    updateDashboard();
}

function editTransaction(id) {
    const transaction = transactions.find(item => item.id === Number(id));

    if (!transaction) return;

    $("description").value = transaction.description;
    $("amount").value = transaction.amount;
    $("type").value = transaction.type;

    populateCategories();

    $("category").value = transaction.category;
    $("date").value = transaction.date;
    $("paymentMethod").value = transaction.paymentMethod;
    $("editingId").value = transaction.id;

    $("submitBtn").textContent = "Update Transaction";
    $("formTitle").textContent = "Edit Transaction";
    $("cancelEditBtn").hidden = false;

    $("transactionForm").scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

function cancelEdit() {
    $("transactionForm").reset();
    $("editingId").value = "";
    $("submitBtn").textContent = "Add Transaction";
    $("formTitle").textContent = "Add Transaction";
    $("cancelEditBtn").hidden = true;

    setTodayDate();
    populateCategories();
}

function deleteTransaction(id) {
    const confirmed = confirm("Are you sure you want to delete this transaction?");

    if (!confirmed) return;

    transactions = transactions.filter(
        transaction => transaction.id !== Number(id)
    );

    if ($("editingId").value === String(id)) {
        cancelEdit();
    }

    updateCategoryFilter();
    renderTransactions();
    updateDashboard();
}

function handleTransactionAction(event) {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const id = Number(button.dataset.id);

    if (button.dataset.action === "edit") {
        editTransaction(id);
    }

    if (button.dataset.action === "delete") {
        deleteTransaction(id);
    }
}

function getFilteredTransactions() {
    const search = $("searchInput").value.toLowerCase().trim();
    const type = $("typeFilter").value;
    const category = $("categoryFilter").value;
    const sort = $("sortFilter").value;

    let filtered = [...transactions];

    if (search) {
        filtered = filtered.filter(transaction =>
            transaction.description.toLowerCase().includes(search) ||
            transaction.category.toLowerCase().includes(search) ||
            transaction.paymentMethod.toLowerCase().includes(search) ||
            transaction.type.toLowerCase().includes(search)
        );
    }

    if (type !== "all") {
        filtered = filtered.filter(transaction => transaction.type === type);
    }

    if (category !== "all") {
        filtered = filtered.filter(transaction => transaction.category === category);
    }

    switch (sort) {
        case "newest":
            filtered.sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
            break;
        case "oldest":
            filtered.sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
            break;
        case "high-low":
            filtered.sort((a, b) => b.amount - a.amount);
            break;
        case "low-high":
            filtered.sort((a, b) => a.amount - b.amount);
            break;
        case "az":
            filtered.sort((a, b) => a.description.localeCompare(b.description));
            break;
    }

    return filtered;
}

function renderTransactions() {
    const tbody = $("transactionTableBody");
    const filtered = getFilteredTransactions();

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">No transactions found.</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(transaction => `
        <tr>
            <td>${escapeHTML(transaction.description)}</td>
            <td>
                <span class="type-badge ${transaction.type}">
                    ${escapeHTML(transaction.type)}
                </span>
            </td>
            <td>${escapeHTML(transaction.category)}</td>
            <td class="${transaction.type}">
                ${transaction.type === "income" ? "+" : "-"}${money(transaction.amount)}
            </td>
            <td>${formatDate(transaction.date)}</td>
            <td>${escapeHTML(transaction.paymentMethod)}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit-btn" data-action="edit" data-id="${transaction.id}">Edit</button>
                    <button class="action-btn delete-btn" data-action="delete" data-id="${transaction.id}">Delete</button>
                </div>
            </td>
        </tr>
    `).join("");
}

function getTotals() {
    const income = transactions
        .filter(transaction => transaction.type === "income")
        .reduce((total, transaction) => total + transaction.amount, 0);

    const expenses = transactions
        .filter(transaction => transaction.type === "expense")
        .reduce((total, transaction) => total + transaction.amount, 0);

    return {
        income,
        expenses,
        balance: income - expenses
    };
}

function getCurrentMonthExpenses() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return transactions
        .filter(transaction => {
            if (transaction.type !== "expense") return false;

            const transactionDate = new Date(transaction.date + "T00:00:00");

            return transactionDate.getMonth() === currentMonth &&
                transactionDate.getFullYear() === currentYear;
        })
        .reduce((total, transaction) => total + transaction.amount, 0);
}

function updateBudgetUI() {
    const spent = getCurrentMonthExpenses();
    const remaining = monthlyBudget - spent;

    $("budgetSpent").textContent = money(spent);
    $("budgetRemaining").textContent = money(remaining);

    if (monthlyBudget <= 0) {
        $("budgetProgress").style.width = "0%";
        $("budgetProgress").style.background = "#22b573";
        $("budgetMessage").textContent = "No budget set.";
        return;
    }

    const percentage = Math.min((spent / monthlyBudget) * 100, 100);

    $("budgetProgress").style.width = `${percentage}%`;

    if (spent > monthlyBudget) {
        $("budgetProgress").style.background = "#ef4444";
        $("budgetMessage").textContent = "Warning! You have exceeded your monthly budget.";
    } else if (percentage >= 80) {
        $("budgetProgress").style.background = "#f59e0b";
        $("budgetMessage").textContent = "Warning! You are approaching your budget limit.";
    } else {
        $("budgetProgress").style.background = "#22b573";
        $("budgetMessage").textContent = "You are within your monthly budget.";
    }
}

function setBudget() {
    const input = prompt("Enter your monthly budget:");

    if (input === null || input.trim() === "") return;

    const value = Number(input);

    if (!Number.isFinite(value) || value < 0) {
        alert("Please enter a valid budget.");
        return;
    }

    monthlyBudget = value;
    updateDashboard();
}

function renderCategorySpending() {
    const expenses = transactions.filter(transaction => transaction.type === "expense");
    const container = $("categorySpending");

    if (expenses.length === 0) {
        container.innerHTML = `<p class="empty-analytics">No expense data available.</p>`;
        return;
    }

    const categoryTotals = {};

    expenses.forEach(transaction => {
        categoryTotals[transaction.category] =
            (categoryTotals[transaction.category] || 0) + transaction.amount;
    });

    const maxAmount = Math.max(...Object.values(categoryTotals));

    container.innerHTML = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .map(([category, amount]) => {
            const percentage = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;

            return `
                <div class="category-item">
                    <div class="category-info">
                        <span>${escapeHTML(category)}</span>
                        <strong>${money(amount)}</strong>
                    </div>
                    <div class="category-track">
                        <div class="category-bar" style="width:${percentage}%"></div>
                    </div>
                </div>
            `;
        })
        .join("");
}

function updateStatistics() {
    const incomes = transactions.filter(transaction => transaction.type === "income");
    const expenses = transactions.filter(transaction => transaction.type === "expense");
    const expenseAmounts = expenses.map(transaction => transaction.amount);

    const totalExpenseAmount = expenseAmounts.reduce((total, amount) => total + amount, 0);
    const averageExpense = expenseAmounts.length ? totalExpenseAmount / expenseAmounts.length : 0;
    const highestExpense = expenseAmounts.length ? Math.max(...expenseAmounts) : 0;
    const lowestExpense = expenseAmounts.length ? Math.min(...expenseAmounts) : 0;

    $("totalTransactions").textContent = transactions.length;
    $("incomeTransactions").textContent = incomes.length;
    $("expenseTransactions").textContent = expenses.length;
    $("averageExpense").textContent = money(averageExpense);
    $("highestExpense").textContent = money(highestExpense);
    $("lowestExpense").textContent = money(lowestExpense);
}

function updateDashboard() {
    const totals = getTotals();

    $("totalIncome").textContent = money(totals.income);
    $("totalExpenses").textContent = money(totals.expenses);
    $("balance").textContent = money(totals.balance);
    $("budgetAmount").textContent = money(monthlyBudget);

    updateBudgetUI();
    updateStatistics();
    renderCategorySpending();
}

function exportCSV() {
    if (transactions.length === 0) {
        alert("There are no transactions to export.");
        return;
    }

    const headers = [
        "Description",
        "Type",
        "Category",
        "Amount",
        "Date",
        "Payment Method"
    ];

    const rows = transactions.map(transaction => [
        transaction.description,
        transaction.type,
        transaction.category,
        transaction.amount.toFixed(2),
        transaction.date,
        transaction.paymentMethod
    ]);

    const escapeCSV = value => `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csvContent = [
        headers.map(escapeCSV).join(","),
        ...rows.map(row => row.map(escapeCSV).join(","))
    ].join("\r\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "expense-tracker-transactions.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
}

function initializeApp() {
    setTodayDate();
    populateCategories();
    updateCategoryFilter();
    renderTransactions();
    updateDashboard();

    $("type").addEventListener("change", populateCategories);
    $("transactionForm").addEventListener("submit", addTransaction);
    $("transactionTableBody").addEventListener("click", handleTransactionAction);
    $("cancelEditBtn").addEventListener("click", cancelEdit);
    $("setBudgetBtn").addEventListener("click", setBudget);
    $("exportBtn").addEventListener("click", exportCSV);

    $("searchInput").addEventListener("input", renderTransactions);
    $("typeFilter").addEventListener("change", renderTransactions);
    $("categoryFilter").addEventListener("change", renderTransactions);
    $("sortFilter").addEventListener("change", renderTransactions);
}

initializeApp();
