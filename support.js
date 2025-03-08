document.getElementById("support-form").addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const message = document.getElementById("message").value;

    try {
        const response = await fetch("http://localhost:5000/support", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, message }),
        });

        const data = await response.json();
        document.getElementById("response-message").textContent = data.message;

        if (response.ok) {
            document.getElementById("support-form").reset();
        }
    } catch (error) {
        console.error("Error submitting support request:", error);
        document.getElementById("response-message").textContent = "Error submitting support request. Please try again.";
    }
});
