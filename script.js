
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



/* =================================
   COMMIT 4: FILTER & SORT
================================= */

function getFilteredTransactions() {
    const search = $("searchInput").value.toLowerCase().trim();
    const type = $("typeFilter").value;
    const category = $("categoryFilter").value;
    const sort = $("sortFilter").value;

    let filtered = [...transactions];

    // Search
    if (search) {
        filtered = filtered.filter(t =>
            t.description.toLowerCase().includes(search)
            || t.category.toLowerCase().includes(search)
            || t.paymentMethod.toLowerCase().includes(search)
        );
    }

    // Type filter
    if (type !== "all") {
        filtered = filtered.filter(t => t.type === type);
    }

    // Category filter
    if (category !== "all") {
        filtered = filtered.filter(t => t.category === category);
    }

    // Sorting
    switch (sort) {
        case "newest":
            filtered.sort((a, b) => b.date.localeCompare(a.date));
            break;

        case "oldest":
            filtered.sort((a, b) => a.date.localeCompare(b.date));
            break;

        case "high-low":
            filtered.sort((a, b) => b.amount - a.amount);
            break;

        case "low-high":
            filtered.sort((a, b) => a.amount - b.amount);
            break;

        case "az":
            filtered.sort((a, b) =>
                a.description.localeCompare(b.description)
            );
            break;
    }

    return filtered;
}


// =================================
// Update Category Filter
// =================================

function updateCategoryFilter() {
    const selected = $("categoryFilter").value;

    const allCategories = [
        ...new Set([
            ...expenseCategories,
            ...incomeCategories,
            ...transactions.map(t => t.category)
        ])
    ];

    $("categoryFilter").innerHTML =
        '<option value="all">All Categories</option>'
        + allCategories.map(category => `
            <option value="${escapeHTML(category)}">
                ${escapeHTML(category)}
            </option>
        `).join("");

    if (allCategories.includes(selected)) {
        $("categoryFilter").value = selected;
    }
}


/* =================================
   COMMIT 5: CSV EXPORT
================================= */

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

    // Escape values safely for CSV.
    const escapeCSV = value => {
        const text = String(value ?? "");

        return `"${text.replace(/"/g, '""')}"`;
    };

    const csvContent = [
        headers.map(escapeCSV).join(","),
        ...rows.map(row => row.map(escapeCSV).join(","))
    ].join("\n");

    // UTF-8 BOM improves Excel compatibility.
    const blob = new Blob(
        ["\uFEFF" + csvContent],
        {
            type: "text/csv;charset=utf-8;"
        }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "expense-tracker-transactions.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
}


// =================================
// Cancel Edit
// =================================

function cancelEdit() {
    $("transactionForm").reset();

    $("editingId").value = "";
    $("submitBtn").textContent = "Add Transaction";

    $("cancelEditBtn").hidden = true;

    setTodayDate();
    populateCategories();
}


// =================================
// Update Edit Function
// =================================

// Add the cancel button when editing.

const originalEditTransaction = editTransaction;

editTransaction = function(id) {
    originalEditTransaction(id);

    $("cancelEditBtn").hidden = false;
};


// =================================
// Update Transaction Function
// =================================

// Hide cancel button after saving.

const originalAddTransaction = addTransaction;

addTransaction = function(event) {
    const wasEditing = $("editingId").value !== "";

    originalAddTransaction(event);

    if (wasEditing) {
        $("cancelEditBtn").hidden = true;
    }
};


// =================================
// Export Event Listener
// =================================

$("exportBtn").addEventListener("click", exportCSV);


// =================================
// Cancel Edit Event Listener
// =================================

$("cancelEditBtn").addEventListener("click", cancelEdit);



// =================================
// Render Filtered Transactions
// =================================

function renderTransactions() {
    const tbody = $("transactionTableBody");
    const filtered = getFilteredTransactions();

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    No transactions found.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(transaction => `
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
    `).join("");
}


// =================================
// Financial Statistics
// =================================

function updateStatistics() {
    const incomeTransactions = transactions.filter(
        t => t.type === "income"
    );

    const expenseTransactions = transactions.filter(
        t => t.type === "expense"
    );

    const expenses = expenseTransactions.map(t => t.amount);

    const totalExpenses = expenses.reduce(
        (total, amount) => total + amount,
        0
    );

    const averageExpense = expenses.length
        ? totalExpenses / expenses.length
        : 0;

    const highestExpense = expenses.length
        ? Math.max(...expenses)
        : 0;

    const lowestExpense = expenses.length
        ? Math.min(...expenses)
        : 0;

    $("totalTransactions").textContent = transactions.length;

    $("incomeTransactions").textContent =
        incomeTransactions.length;

    $("expenseTransactions").textContent =
        expenseTransactions.length;

    $("averageExpense").textContent =
        money(averageExpense);

    $("highestExpense").textContent =
        money(highestExpense);

    $("lowestExpense").textContent =
        money(lowestExpense);
}


// =================================
// Filter Event Listeners
// =================================

$("searchInput").addEventListener("input", renderTransactions);

$("typeFilter").addEventListener("change", renderTransactions);

$("categoryFilter").addEventListener("change", renderTransactions);

$("sortFilter").addEventListener("change", renderTransactions);


