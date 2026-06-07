const COLORS = {
    "-2": "#000000",
    "-1": "none",
     "0": "#ffffff",
     "1": "#ff0000",
     "2": "#00ff00",
     "3": "#78009D",
     "4": "#ff9b54",
     "5": "#00a3c7",
     "6": "#ff00f2",
     "7": "#ffa5c4",
     "8": "#126E75",
     "9": "#b778ff",
    "10": "#9A5B12",
    "11": "#620000",
    "12": "#FBFF00",
    "13": "#aaffc3",
    // "14": "#5858ff",
    // "15": "#B2B369",
    // "16": "#4F6E4D"
};

const HEX_RADIUS = 30;

function hexPoints(cx, cy, radius) {

    const points = [];

    for (let i = 0; i < 6; i++) {

        const angle =
            (Math.PI / 180) *
            (60 * i);

        const x =
            cx + radius * Math.cos(angle);

        const y =
            cy + radius * Math.sin(angle);

        points.push(`${x},${y}`);
    }

    return points.join(" ");
}

function boardToPixel(row, col) {
    const x = 1.5 * HEX_RADIUS * col;
    const y = Math.sqrt(3) * HEX_RADIUS * (row - col / 2);

    return [x, y];
}

function drawBoard(board) {
    const xOffset = 150;
    const yOffset = 150;

    const svg = document.getElementById("board");

    svg.innerHTML = "";

    const hexCenters = []

    for (let row = 0; row < board.length; row++) {
        for (let col = 0; col < board[row].length; col++) {
            const cell = board[row][col];

            if (cell === -1) {
                continue;
            }

            let [x, y] = boardToPixel(col, row);

            x += xOffset;
            y += yOffset;

            hexCenters.push([x, y]);

            const poly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");

            poly.setAttribute("points", hexPoints(x, y, HEX_RADIUS));
            poly.setAttribute("fill", COLORS[cell]);
            poly.setAttribute("stroke", "black");
            poly.setAttribute("stroke-width", "2");

            svg.appendChild(poly);

            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");

            text.setAttribute("x", x);
            text.setAttribute("y", y);

            text.setAttribute("text-anchor", "middle");
            text.setAttribute("dominant-baseline", "middle");
            text.setAttribute("dy", "0.05em");

            text.setAttribute("font-size", String(HEX_RADIUS / 1.75));
            text.setAttribute("font-family", "Arial");
            if (cell === -2) {
                text.setAttribute("fill", "white");
            } else {
                text.setAttribute("fill", "black");
            }

            text.textContent = BOARD[row][col];

            svg.appendChild(text);
        }
    }

    const bounds = hexCenters.reduce((acc, [x, y]) => {
            return {
                minX: Math.min(acc.minX, x),
                minY: Math.min(acc.minY, y),
                maxX: Math.max(acc.maxX, x),
                maxY: Math.max(acc.maxY, y)
            };
        }, {minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity});
    
    const minXCoords = hexCenters.filter(([x, _]) => x === bounds.minX).sort((x, y) => x[0] - y[0] || x[1] - y[1]);
    const minYCoords = hexCenters.filter(([_, y]) => y === bounds.minY).sort((x, y) => x[0] - y[0] || x[1] - y[1]);
    const maxXCoords = hexCenters.filter(([x, _]) => x === bounds.maxX).sort((x, y) => x[0] - y[0] || x[1] - y[1]);
    const maxYCoords = hexCenters.filter(([_, y]) => y === bounds.maxY).sort((x, y) => x[0] - y[0] || x[1] - y[1]);

    const points = [
        [minXCoords[0][0] - 1.5 * HEX_RADIUS, minXCoords[0][1] - Math.sqrt(3) / 2 * HEX_RADIUS],
        [minYCoords[0][0], minYCoords[0][1] - Math.sqrt(3) * HEX_RADIUS],
        [minYCoords[minYCoords.length-1][0], minYCoords[minYCoords.length-1][1] - Math.sqrt(3) * HEX_RADIUS],
        [maxXCoords[0][0] + 1.5 * HEX_RADIUS, maxXCoords[0][1] - Math.sqrt(3) / 2 * HEX_RADIUS],
        [maxXCoords[maxXCoords.length-1][0] + 1.5 * HEX_RADIUS, maxXCoords[maxXCoords.length-1][1] + Math.sqrt(3) / 2 * HEX_RADIUS],
        [maxYCoords[maxYCoords.length-1][0], maxYCoords[maxYCoords.length-1][1] + Math.sqrt(3) * HEX_RADIUS],
        [maxYCoords[0][0], maxYCoords[0][1] + Math.sqrt(3) * HEX_RADIUS],
        [minXCoords[minXCoords.length-1][0] - 1.5 * HEX_RADIUS, minXCoords[minXCoords.length-1][1] + Math.sqrt(3) / 2 * HEX_RADIUS],
    ]

    const border = document.createElementNS("http://www.w3.org/2000/svg", "polygon");

    border.setAttribute("points", points)
    border.setAttribute("fill", "white")

    svg.insertBefore(border, svg.firstChild);
}

drawBoard(boardToSolution(BOARD, "May", "21", "Thu"))

document
    .getElementById("solveButton")
    .addEventListener("click", () => {

        const result =
            window.solveCalendar(
                "May",
                "21",
                "Thu"
            );

        if (!result.solved) {
            output.textContent = "No solution found";
            return;
        }
        
        drawBoard(result.solution);
    });




