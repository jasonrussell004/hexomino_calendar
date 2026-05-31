document
    .getElementById("solveBtn")
    .addEventListener("click", () => {

        const result =
            window.solveCalendar(
                "May",
                "21",
                "Thu"
            );

        document
            .getElementById("output")
            .textContent =
            JSON.stringify(
                result.solution,
                null,
                2
            );
    });