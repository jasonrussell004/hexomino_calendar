document
    .getElementById("solveBtn")
    .addEventListener("click", () => {

        const result =
            window.solveCalendar(
                "May",
                "21",
                "Thu"
            );

        const output =
            document.getElementById("output");

        if (!result.solved) {
            output.textContent = "No solution found";
            return;
        }

        output.textContent =
            JSON.stringify(
                result.solution,
                null,
                2
            );
    });