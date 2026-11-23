
/* =================================
   COMMIT 2: TRANSACTION MANAGEMENT
================================= */

// Create a transaction.
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

    // Editing an existing transaction.
    if (editingId) {
        const transaction = transactions.find(
            t => t.id === Number(editingId)
        );

        if (transaction) {
            Object.assign(transaction, transactionData);
        }

        $("submitBtn").textContent = "Add Transaction";
        $("editingId").value = "";
    } else {
        // Adding a new transaction.
        transactions.push({
            id: nextId++,
            ...transactionData
        });
    }

    $("transactionForm").reset();

    setTodayDate();
    populateCategories();

    renderTransactions();
    updateDashboard();

    console.log("Transaction saved:", transactionData);
}


// =================================
// Render Transactions
// =================================

function renderTransactions() {
    const tbody = $("transactionTableBody");

    if (transactions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    No transactions found.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = transactions
        .map(transaction => `
            <tr>
                <td>${escapeHTML(transaction.description)}</td>

                <td>
                    <span class="type-badge ${transaction.type}">
                        ${transaction.type}
                    </span>
                </td>

                <td>${escapeHTML(transaction.category)}</td>

                <td class="${transaction.type}">
                    ${transaction.type === "income" ? "+" : "-"}
                    ${money(transaction.amount)}
                </td>

                <td>${formatDate(transaction.date)}</td>

                <td>${escapeHTML(transaction.paymentMethod)}</td>

                <td>
                    <div class="action-buttons">
                        <button
                            class="action-btn edit-btn"
                            data-action="edit"
                            data-id="${transaction.id}"
                        >
                            Edit
                        </button>

                        <button
                            class="action-btn delete-btn"
                            data-action="delete"
                            data-id="${transaction.id}"
                        >
                            Delete
                        </button>
                    </div>
                </td>
            </tr>
        `)
        .join("");
}


// =================================
// Edit Transaction
// =================================

function editTransaction(id) {
    const transaction = transactions.find(
        t => t.id === Number(id)
    );

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

    $("transactionForm").scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}


// =================================
// Delete Transaction
// =================================

function deleteTransaction(id) {
    const confirmed = confirm(
        "Are you sure you want to delete this transaction?"
    );

    if (!confirmed) return;

    transactions = transactions.filter(
        t => t.id !== Number(id)
    );

    renderTransactions();
    updateDashboard();
}


// =================================
// Table Event Delegation
// =================================

function handleTransactionAction(event) {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const id = Number(button.dataset.id);
    const action = button.dataset.action;

    if (action === "edit") {
        editTransaction(id);
    }

    if (action === "delete") {
        deleteTransaction(id);
    }
}


// =================================
// Utility Functions
// =================================

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function formatDate(dateString) {
    const date = new Date(dateString + "T00:00:00");

    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}


// =================================
// Commit 2 Event Listeners
// =================================

$("transactionForm").addEventListener(
    "submit",
    addTransaction
);

$("transactionTableBody").addEventListener(
    "click",
    handleTransactionAction
);



/* =================================
   COMMIT 3: FINANCIAL DASHBOARD
================================= */

function getTotals() {
    const income = transactions
        .filter(t => t.type === "income")
        .reduce((total, t) => total + t.amount, 0);

    const expenses = transactions
        .filter(t => t.type === "expense")
        .reduce((total, t) => total + t.amount, 0);

    return {
        income,
        expenses,
        balance: income - expenses
    };
}


// =================================
// Current Month Expenses
// =================================

function getCurrentMonthExpenses() {
    const now = new Date();

    return transactions
        .filter(t => {
            if (t.type !== "expense") return false;

            const transactionDate = new Date(
                t.date + "T00:00:00"
            );

            return transactionDate.getMonth() === now.getMonth()
                && transactionDate.getFullYear() === now.getFullYear();
        })
        .reduce((total, t) => total + t.amount, 0);
}


// =================================
// Dashboard Update
// =================================

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


// =================================
// Budget UI
// =================================

function updateBudgetUI() {
    const spent = getCurrentMonthExpenses();
    const remaining = monthlyBudget - spent;

    $("budgetSpent").textContent = money(spent);
    $("budgetRemaining").textContent = money(remaining);

    if (monthlyBudget <= 0) {
        $("budgetProgress").style.width = "0%";
        $("budgetMessage").textContent = "No budget set.";
        return;
    }

    const percentage = Math.min(
        (spent / monthlyBudget) * 100,
        100
    );

    $("budgetProgress").style.width = `${percentage}%`;

    if (spent > monthlyBudget) {
        $("budgetProgress").style.background = "#ef4444";

        $("budgetMessage").textContent =
            "Warning! You have exceeded your monthly budget.";
    } else if (percentage >= 80) {
        $("budgetProgress").style.background = "#f59e0b";

        $("budgetMessage").textContent =
            "Warning! You are approaching your budget limit.";
    } else {
        $("budgetProgress").style.background = "#22b573";

        $("budgetMessage").textContent =
            "You are within your monthly budget.";
    }
}


// =================================
// Set Budget
// =================================

function setBudget() {
    const input = prompt("Enter your monthly budget:");

    if (input === null) return;

    const value = Number(input);

    if (!Number.isFinite(value) || value < 0) {
        alert("Please enter a valid budget.");
        return;
    }

    monthlyBudget = value;

    updateDashboard();
}


// =================================
// Spending by Category
// =================================

function renderCategorySpending() {
    const expenses = transactions.filter(
        t => t.type === "expense"
    );

    const container = $("categorySpending");

    if (expenses.length === 0) {
        container.innerHTML = `
            <p class="empty-analytics">
                No expense data available.
            </p>
        `;
        return;
    }

    const categoryTotals = {};

    expenses.forEach(transaction => {
        categoryTotals[transaction.category] =
            (categoryTotals[transaction.category] || 0)
            + transaction.amount;
    });

    const maxAmount = Math.max(
        ...Object.values(categoryTotals)
    );

    container.innerHTML = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .map(([category, amount]) => {
            const percentage = (amount / maxAmount) * 100;

            return `
                <div class="category-item">
                    <div class="category-info">
                        <span>${escapeHTML(category)}</span>
                        <strong>${money(amount)}</strong>
                    </div>

                    <div class="category-track">
                        <div
                            class="category-bar"
                            style="width:${percentage}%"
                        ></div>
                    </div>
                </div>
            `;
        })
        .join("");
}


// =================================
// Budget Event Listener
// =================================

$("setBudgetBtn").addEventListener("click", setBudget);

