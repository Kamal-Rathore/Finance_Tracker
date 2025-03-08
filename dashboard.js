document.addEventListener("DOMContentLoaded", function () {
    fetchUserDetails();
    getTransactions();
    document.getElementById("currency").addEventListener("change", () => updateBalance(transactions));
});

const API_URL = "http://localhost:5000";
let transactions = [];

// Delete Transaction
async function deleteTransaction(id) {
    try {
        const response = await fetch(`${API_URL}/transactions/${id}`, {
            method: "DELETE"
        });

        if (response.ok) {
            getTransactions(); // Refresh transaction list
        } else {
            alert("Error deleting transaction.");
        }
    } catch (error) {
        console.error("Delete Error:", error);
    }
}

// Fetch user details from local storage
function fetchUserDetails() {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
        window.location.href = "login.html"; // Redirect if not logged in
        return;
    }
    document.getElementById("welcome-message").textContent = `Welcome, ${user.full_name}!`;
    document.getElementById("user-email").textContent = user.email;
}

// Fetch transactions from the backend
async function getTransactions() {
    try {
        const response = await fetch(`${API_URL}/transactions`);
        transactions = await response.json();
        updateTransactionTable(transactions);
        updateBalance(transactions);
        renderCharts(transactions); // Call chart rendering function
    } catch (error) {
        console.error("Error fetching transactions:", error);
    }
}

// Update transactions table
function updateTransactionTable(transactions) {
    const transactionTable = document.getElementById("transaction-table");
    while (transactionTable.rows.length > 1) {
        transactionTable.deleteRow(1);
    }
    transactions.forEach(transaction => {
        const row = transactionTable.insertRow();
        row.innerHTML = `
            <td>${formatDate(new Date(transaction.date))}</td>
            <td>${transaction.description}</td>
            <td>₹${parseFloat(transaction.amount).toFixed(2)}</td>
            <td>${transaction.type}</td>
            <td>
                <button class="edit-button" onclick="editTransaction(${transaction.id})">Edit</button>
                <button class="delete-button" onclick="deleteTransaction(${transaction.id})">Delete</button>
            </td>
        `;
    });
}

// Update balance
function updateBalance(transactions) {
    let balance = transactions.reduce((total, t) => {
        return t.type === "income" ? total + parseFloat(t.amount) : total - parseFloat(t.amount);
    }, 0);
    const currencyCode = document.getElementById("currency").value;
    document.getElementById("balance").textContent = `${currencyCode} ${balance.toFixed(2)}`;
}

// Render Charts
function renderCharts(transactions) {
    const income = transactions.filter(t => t.type === "income").reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const expense = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const ctx1 = document.getElementById("incomeExpenseChart").getContext("2d");
    new Chart(ctx1, {
        type: "pie",
        data: {
            labels: ["Income", "Expense"],
            datasets: [{
                data: [income, expense],
                backgroundColor: ["#2ecc71", "#e74c3c"]
            }]
        }
    });
    
    const monthlyData = {};
    transactions.forEach(t => {
        const month = new Date(t.date).toLocaleString("default", { month: "short" });
        monthlyData[month] = (monthlyData[month] || 0) + parseFloat(t.amount);
    });
    
    const ctx2 = document.getElementById("monthlyTransactionChart").getContext("2d");
    new Chart(ctx2, {
        type: "bar",
        data: {
            labels: Object.keys(monthlyData),
            datasets: [{
                label: "Monthly Transactions",
                data: Object.values(monthlyData),
                backgroundColor: "#3498db"
            }]
        }
    });
}

// Logout function
function logout() {
    localStorage.removeItem("user");
    window.location.href = "login.html";
}

// Format date as DD/MM/YYYY
function formatDate(date) {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Event Listeners
document.getElementById("add-transaction-btn").addEventListener("click", addTransaction);
