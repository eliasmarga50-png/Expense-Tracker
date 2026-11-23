
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
