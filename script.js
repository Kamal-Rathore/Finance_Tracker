const API_URL = "http://localhost:5000";

// Initialize transactions array
let transactions = [];

// Ensure script runs only after DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
    const addTransactionBtn = document.getElementById("add-transaction-btn");

    if (addTransactionBtn) {
        addTransactionBtn.addEventListener("click", addTransaction);
    } else {
        console.error("❌ Element with ID 'add-transaction-btn' not found.");
    }

    getTransactions();


    const exportButton = document.getElementById("export-button");

    if (exportButton) {
        exportButton.addEventListener("click", handleDownload);
    } else {
        console.error("❌ Element with ID 'export-button' not found.");
    }
});

document.getElementById("support-form").addEventListener("submit", async (event) => {
    event.preventDefault(); // Prevent page reload

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const message = document.getElementById("message").value;

    try {
        const response = await fetch("http://localhost:5000/support", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, message }),
        });

        if (!response.ok) {
            throw new Error("Failed to submit form");
        }

        const data = await response.json();
        alert(data.message); // Show success message

        // Clear form after submission
        document.getElementById("support-form").reset();
    } catch (error) {
        console.error("Error submitting support request:", error);
        alert("Error submitting support request. Please try again.");
    }
});

// Fetch transactions from the backend
async function getTransactions() {
    try {
        const response = await fetch(`${API_URL}/transactions`);
        transactions = await response.json();

        if (!Array.isArray(transactions)) {
            console.error("Error: Transactions response is not an array", transactions);
            return;
        }

        console.log("Fetched transactions:", transactions);
        updateTransactionTable(transactions);
        updateBalance(transactions);  // ✅ Ensure balance updates!
    } catch (error) {
        console.error("Error fetching transactions:", error);
    }
}

// Add a new transaction
async function addTransaction() {
    const description = document.getElementById("description").value;
    const amount = parseFloat(document.getElementById("amount").value);
    const type = document.getElementById("type").value;

    if (!description || isNaN(amount)) {
        alert("Please enter valid details.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/transactions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ description, amount, type }),
        });

        if (response.ok) {
            getTransactions();  // ✅ Refresh transactions
        } else {
            alert("Error adding transaction.");
        }
    } catch (error) {
        console.error("Transaction Error:", error);
    }
}

// Delete a transaction
async function deleteTransaction(id) {
    try {
        const response = await fetch(`${API_URL}/transactions/${id}`, {
            method: "DELETE",
        });

        if (response.ok) {
            getTransactions();  // ✅ Refresh transactions
        } else {
            alert("Error deleting transaction.");
        }
    } catch (error) {
        console.error("Delete Error:", error);
    }
}

// Update the transaction table dynamically
function updateTransactionTable(transactions) {
    const transactionTable = document.getElementById("transaction-table");

    // Clear existing rows (excluding headers)
    while (transactionTable.rows.length > 1) {
        transactionTable.deleteRow(1);
    }

    transactions.forEach((transaction) => {
        const newRow = transactionTable.insertRow();

        const dateCell = newRow.insertCell();
        dateCell.textContent = formatDate(new Date(transaction.date));

        const descriptionCell = newRow.insertCell();
        descriptionCell.textContent = transaction.description;

        const amountCell = newRow.insertCell();
        const amount = parseFloat(transaction.amount);
        amountCell.textContent = isNaN(amount) ? "Invalid" : amount.toFixed(2);

        const typeCell = newRow.insertCell();
        typeCell.textContent = transaction.type;

        const actionCell = newRow.insertCell();
        
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.classList.add("delete-button");
        deleteButton.addEventListener("click", () => deleteTransaction(transaction.id));
        actionCell.appendChild(deleteButton);
    });

    updateBalance(transactions);
}

// Update balance
function updateBalance(transactions) {
    const balanceElement = document.getElementById("balance");
    const currencySelect = document.getElementById("currency");

    if (!balanceElement) {
        console.error("❌ Element with id 'balance' not found in HTML.");
        return;
    }

    if (!currencySelect) {
        console.error("❌ Element with id 'currency' not found in HTML.");
        return;
    }

    if (!transactions || transactions.length === 0) {
        console.warn("⚠️ No transactions found.");
        balanceElement.textContent = "₹0.00"; // Default to zero if no transactions
        return;
    }

    let balance = 0.0;

    transactions.forEach((transaction) => {
        console.log("Transaction:", transaction);
        const amount = parseFloat(transaction.amount);
        
        if (transaction.type === "income") {
            balance += amount;
        } else if (transaction.type === "expense") {
            balance -= amount;
        }
    });

    console.log("Updated Balance:", balance);

    const currencyCode = currencySelect.value;
    balanceElement.textContent = `₹${balance.toFixed(2)}`;

    // Apply positive/negative balance styling
    balanceElement.classList.toggle("negative-balance", balance < 0);
    balanceElement.classList.toggle("positive-balance", balance >= 0);
}

// Handle Export Functionality
function handleDownload() {
    const format = prompt("Export format: PDF or CSV").toLowerCase();
    if (format === "pdf") exportToPDF();
    else if (format === "csv") exportToCSV();
    else alert("Invalid format! Please enter PDF or CSV.");
}

// Export to PDF
function exportToPDF() {
    if (!transactions || transactions.length === 0) {
        alert("No transactions to export!");
        return;
    }

    const docDefinition = {
        content: [
            { text: 'Transaction Report', style: 'header' },
            {
                table: {
                    headerRows: 1,
                    widths: ['auto', '*', 'auto', 'auto'],
                    body: [
                        ['Date', 'Description', 'Amount', 'Type'],
                        ...transactions.map(transaction => {
                            const amount = parseFloat(transaction.amount);  // ✅ Ensure it's a number
                            return [
                                formatDate(new Date(transaction.date)),
                                transaction.description,
                                isNaN(amount) ? "Invalid" : amount.toFixed(2),  // ✅ Handle invalid numbers
                                transaction.type
                            ];
                        })
                    ]
                }
            }
        ],
        styles: {
            header: {
                fontSize: 14,
                bold: true,
                margin: [0, 10, 0, 10]
            }
        }
    };

    pdfMake.createPdf(docDefinition).download("transactions.pdf");
}


// Export to CSV
function exportToCSV() {
    if (!transactions || transactions.length === 0) {
        alert("No transactions to export!");
        return;
    }

    const csvContent =
        "Date,Description,Amount,Type\n" +
        transactions.map(transaction => {
            const amount = parseFloat(transaction.amount);  // ✅ Convert to number
            return `${formatDate(new Date(transaction.date))},${transaction.description},${isNaN(amount) ? "Invalid" : amount.toFixed(2)},${transaction.type}`;
        }).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "transactions.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}


// Format date as DD/MM/YYYY
function formatDate(date) {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Attach event listeners
document.getElementById("add-transaction-btn").addEventListener("click", addTransaction);
document.getElementById("export-button").addEventListener("click", handleDownload);
