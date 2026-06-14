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

function hexPoints(cx, cy) {
    const points = [];
    for (let i = 0; i < 6; i++) {
        const ang = (Math.PI / 180) * (60 * i);
        points.push(`${cx + HEX_RADIUS * Math.cos(ang)},
                     ${cy + HEX_RADIUS * Math.sin(ang)}`);
    }
    return points.join(" ");
}

function boardToPixel(row, col) {
    return [1.5 * HEX_RADIUS * row,
            Math.sqrt(3) * HEX_RADIUS * (col - row / 2)];
}

/* Inverse: SVG pixel → nearest board [row, col] */
function pixelToBoard(px, py) {
    const row = px / (1.5 * HEX_RADIUS);
    const col = py / (Math.sqrt(3) * HEX_RADIUS) + row / 2;
    return [Math.round(row), Math.round(col)];
}

/* Draw a complete board solution array into #board SVG */
function drawBoard(board) {
    const svg = document.getElementById("board");

    svg.innerHTML = "";

    const centers = [];

    for (let row = 0; row < board.length; row++) {
        for (let col = 0; col < board[row].length; col++) {
            const cell = board[row][col];

            if (cell === -1) {
                continue;
            }

            let [x, y] = boardToPixel(row, col);
            centers.push([x, y]);

            const poly = makeSVG("polygon");
            poly.setAttribute("points", hexPoints(x, y));
            poly.setAttribute("fill", COLORS[cell]);
            poly.setAttribute("stroke", "black");
            poly.setAttribute("stroke-width", "2");

            // Allow clicking placed pieces to remove them (manual mode only)
            if (cell > 0) {
                poly.style.cursor = "pointer";
                poly.dataset.row = row;
                poly.dataset.col = col;
                poly.addEventListener("click", onBoardCellClick);
            }

            svg.appendChild(poly);

            const text = makeSVG("text");

            text.setAttribute("x", x);
            text.setAttribute("y", y);

            text.setAttribute("text-anchor", "middle");
            text.setAttribute("dominant-baseline", "middle");
            text.setAttribute("dy", "0.05em");

            text.setAttribute("font-size", String(HEX_RADIUS / 1.75));
            text.setAttribute("font-family", "Arial");

            text.setAttribute("fill", cell === -2 ? "white" : "black");

            text.textContent = BOARD[row][col];

            if (cell > 0) {
                text.style.cursor = "pointer";
                text.dataset.row = row;
                text.dataset.col = col;
                text.addEventListener("click", onBoardCellClick);
            }
            
            svg.appendChild(text);
        }
    }

    if (!centers.length) {
        return;
    }

    try {
        const bb = svg.getBBox();
        if(bb && bb.width > 0) {
            const p = 10; // pixel thickness of border for board
            svg.setAttribute("viewBox", `${bb.x - p} ${bb.y - p} ${bb.width + p * 2} ${bb.height + p * 2}`);
        }
    } catch(e) {
        return;
    }
}

/* ═══════════════════════════════════════════════════════════
   Manual play state
═══════════════════════════════════════════════════════════ */
const PIECE_NAMES = Object.keys(PIECES);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// manualState[r][c]: -1 null, -2 target date, 0 empty, 1..13 piece color index
let manualState = [];
// pieceState[i]: { rotIdx, placed }
let pieceStates = [];

/* Returns rotated cells for piece i at rotation rotIdx */
function getPieceCells(pieceIdx, rotIdx) {
    const name = PIECE_NAMES[pieceIdx];
    const rots = PIECE_ROTATIONS[name];
    return rots[rotIdx % rots.length];
}

function initManualState() {
    const m = selMonth.value;
    const d = selDay.value;
    const w = selWeekday.value;
    manualState = boardToSolution(BOARD, m, d, w);
    pieceStates = PIECE_NAMES.map(() => ({rotIdx: 0, placed: false}));
    isAutoSolved = false;
}

function redrawBoard() {
    drawBoard(manualState);
}

/* Click on a placed piece to remove it */
function onBoardCellClick(e) {
    // if (isAutoSolved) return; // don't allow removal in auto-solve mode
    const r = parseInt(e.target.dataset.row);
    const c = parseInt(e.target.dataset.col);
    if (isNaN(r) || isNaN(c)) {
        return;
    }
    const colorIdx = manualState[r][c];
    if (colorIdx <= 0) {
        return;
    }

    // Find the piece index (colorIdx = pieceIdx+1)
    const pieceIdx = colorIdx - 1;
    // Remove all cells of this piece
    for (let rr = 0; rr < manualState.length; rr++) {
        for (let cc = 0; cc < manualState[rr].length; cc++) {
            if (manualState[rr][cc] === colorIdx) {
                manualState[rr][cc] = 0;
            }
        }
    }

    pieceStates[pieceIdx].placed = false;
    redrawBoard();
    renderTray();
    setStatus(`"${PIECE_NAMES[pieceIdx]}" removed — drag it back onto the board`);
}

/* Try to place piece at board anchor [anchorRow, anchorCol].
   cells are the piece's current rotation cells (relative axial offsets).
   Returns true if placed. */
function tryPlacePiece(pieceIdx, cells, anchorRow, anchorCol) {
    const colorIdx = pieceIdx + 1;
    const toBoardCoords = cells.map(([dr, dc]) => [anchorRow + dr, anchorCol + dc]);

    // Validate all cells
    for (const [r,c] of toBoardCoords) {
        if (r < 0 || r >= manualState.length || c < 0 || c >= manualState[0].length) {
            return false;
        }
        if (manualState[r][c] !== 0) {
            return false; // occupied, exposed, or null
        }
    }

    // Place
    for (const [r,c] of toBoardCoords) {
        manualState[r][c] = colorIdx;
    }

    pieceStates[pieceIdx].placed = true;

    return true;
}

function checkWin() {
    for (let r = 0; r < manualState.length; r++) {
        for (let c = 0; c < manualState[r].length; c++) {
            if (manualState[r][c] === 0) {
                return false;
            }
        }
    }
    return true;
}

/* ═══════════════════════════════════════════════════════════
   Tray rendering (mini hex SVGs)
═══════════════════════════════════════════════════════════ */
function makeSVG(tag) {
    return document.createElementNS("http://www.w3.org/2000/svg", tag);
}

function renderPieceSVG(pieceIdx, rotIdx) {
    const cells = getPieceCells(pieceIdx, rotIdx);
    const name = PIECE_NAMES[pieceIdx];
    const color = COLORS[String(pieceIdx + 1)];

    // Compute pixel positions in tray coords
    const pts = cells.map(([row, col]) => boardToPixel(row, col));

    const minX = Math.min(...pts.map(([x]) => x));
    const minY = Math.min(...pts.map(([,y]) => y));
    const maxX = Math.max(...pts.map(([x]) => x));
    const maxY = Math.max(...pts.map(([,y]) => y));
    const pad = HEX_RADIUS + 2;
    const W = (maxX - minX) + 2 * pad;
    const H = (maxY - minY) + 2 * pad;

    const svg = makeSVG("svg");
    svg.setAttribute("width", String(Math.ceil(W)));
    svg.setAttribute("height", String(Math.ceil(H)));
    svg.setAttribute("viewBox", `${minX - pad} ${minY - pad} ${W} ${H}`);
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");

    pts.forEach(([x, y]) => {
        const poly = makeSVG("polygon");
        poly.setAttribute("points", hexPoints(x, y));
        poly.setAttribute("fill", color);
        poly.setAttribute("stroke", "black");
        poly.setAttribute("stroke-width", "1.5");
        svg.appendChild(poly);
    });

    return svg;
}

/* Build the ghost SVG for dragging */
function buildGhostSVG(pieceIdx, rotIdx) {
    const cells = getPieceCells(pieceIdx, rotIdx);
    const color = COLORS[String(pieceIdx + 1)];

    const pts = cells.map(([row, col]) => boardToPixel(row, col));
    const minX = Math.min(...pts.map(([x]) => x));
    const minY = Math.min(...pts.map(([,y]) => y));
    const maxX = Math.max(...pts.map(([x]) => x));
    const maxY = Math.max(...pts.map(([,y]) => y));
    const pad = HEX_RADIUS + 2;
    const W = (maxX - minX) + 2 * pad;
    const H = (maxY - minY) + 2 * pad;

    const ghost = document.getElementById("drag-ghost");
    ghost.innerHTML = "";
    ghost.setAttribute("width", String(Math.ceil(W)));
    ghost.setAttribute("height", String(Math.ceil(H)));
    ghost.setAttribute("viewBox", `${minX - pad} ${minY - pad} ${W} ${H}`);

    // Store offsets: where is [0,0] cell relative to SVG top-left
    // We want the cursor to be near cell[0]
    const anchorPt = pts[0];
    ghost.offsetX = anchorPt[0] - (minX - pad);
    ghost.offsetY = anchorPt[1] - (minY - pad);
    ghost.cells = cells;
    ghost.pieceIdx = pieceIdx;

    pts.forEach(([x, y]) => {
        const poly = makeSVG("polygon");
        poly.setAttribute("points", hexPoints(x, y));
        poly.setAttribute("fill", color);
        poly.setAttribute("stroke", "black");
        poly.setAttribute("stroke-width", "2");
        ghost.appendChild(poly);
    });
    return ghost;
}

/* Render the tray */
function renderTray() {
    const tray = document.getElementById("trayPieces");
    tray.innerHTML = "";

    PIECE_NAMES.forEach((name, pieceIdx) => {
        const ps = pieceStates[pieceIdx];
        const rotIdx = ps.rotIdx;
        const placed = ps.placed;

        const card = document.createElement("div");
        card.className = "piece-card" + (placed ? " placed": "");
        card.title = placed ? `${name} (placed — click on board to remove)` : `${name} — drag onto board`;

        // Mini SVG preview
        const psvg = renderPieceSVG(pieceIdx, rotIdx, HEX_RADIUS);
        card.appendChild(psvg);

        // Label
        const lbl = document.createElement("div");
        lbl.className = "piece-label";
        lbl.textContent = name;
        card.appendChild(lbl);

        // Rotation buttons
        const rotRow = document.createElement("div");
        rotRow.className = "piece-rot-btns";

        const ccw = document.createElement("button");
        ccw.className = "rot-btn";
        ccw.textContent = "↺";
        ccw.title = "Rotate counter-clockwise";
        ccw.addEventListener("click", e => {
            e.stopPropagation();
            rotatePiece(pieceIdx, -1);
        });

        const cw = document.createElement("button");
        cw.className = "rot-btn";
        cw.textContent = "↻";
        cw.title = "Rotate clockwise";
        cw.addEventListener("click", e => {
            e.stopPropagation();
            rotatePiece(pieceIdx, 1);
        });

        rotRow.appendChild(ccw);
        rotRow.appendChild(cw);
        card.appendChild(rotRow);

        if (!placed) {
            card.addEventListener("mousedown", e => onDragStart(e, pieceIdx));
            card.addEventListener("touchstart", e => onDragStart(e, pieceIdx), {passive: false});
            card.addEventListener("wheel", e => {
                e.preventDefault();
                rotatePiece(pieceIdx, e.deltaY > 0 ? 1 : -1);
            }, {passive: false});
        }

        tray.appendChild(card);
    });
}

function rotatePiece(pieceIdx, dir) {
    const ps   = pieceStates[pieceIdx];
    const name = PIECE_NAMES[pieceIdx];
    const nRots = PIECE_ROTATIONS[name].length;
    ps.rotIdx  = ((ps.rotIdx + dir) % nRots + nRots) % nRots;
    renderTray();
}

/* ═══════════════════════════════════════════════════════════
   Drag & drop
═══════════════════════════════════════════════════════════ */
let dragPieceIdx = -1;
let ghost = null;

function getClientXY(e) {
    if (e.touches && e.touches.length) return [e.touches[0].clientX, e.touches[0].clientY];
    if (e.changedTouches && e.changedTouches.length) return [e.changedTouches[0].clientX, e.changedTouches[0].clientY];
    return [e.clientX, e.clientY];
}

function onDragStart(e, pieceIdx) {
    e.preventDefault();
    dragPieceIdx = pieceIdx;
    ghost = buildGhostSVG(pieceIdx, pieceStates[pieceIdx].rotIdx);
    ghost.style.display = "block";

    const [cx, cy] = getClientXY(e);
    positionGhost(cx, cy);

    document.addEventListener("mousemove", onDragMove);
    document.addEventListener("touchmove", onDragMove, {passive: false});
    document.addEventListener("mouseup", onDragEnd);
    document.addEventListener("touchend", onDragEnd);
}

function positionGhost(cx, cy) {
    if (!ghost) {
        return;
    }

    ghost.style.left = (cx - ghost.offsetX) + "px";
    ghost.style.top = (cy - ghost.offsetY) + "px";

    // Highlight the drop target
    const hit = getHoveredBoardCell(cx, cy);
    const boardSVG = document.getElementById("board");
    if (hit) {
        const {row, col, valid} = hit;
        boardSVG.className = valid ? "drop-valid" : "drop-invalid";
    } else {
        boardSVG.className = "";
    }
}

function onDragMove(e) {
    e.preventDefault();
    const [cx, cy] = getClientXY(e);
    positionGhost(cx, cy);
}

function onDragEnd(e) {
    document.removeEventListener("mousemove", onDragMove);
    document.removeEventListener("touchmove", onDragMove);
    document.removeEventListener("mouseup", onDragEnd);
    document.removeEventListener("touchend", onDragEnd);

    const boardSVG = document.getElementById("board");
    boardSVG.className = "";

    if (!ghost || dragPieceIdx < 0) {
        cleanup();
        return;
    }

    const [cx, cy] = getClientXY(e);
    const hit = getHoveredBoardCell(cx, cy);

    if (hit && hit.valid) {
        const { anchorRow, anchorCol } = hit;
        const cells = getPieceCells(dragPieceIdx, pieceStates[dragPieceIdx].rotIdx);
        const placed = tryPlacePiece(dragPieceIdx, cells, anchorRow, anchorCol);
        if (placed) {
            redrawBoard();
            renderTray();
            if (checkWin()) {
                setStatus("🎉 Puzzle solved! Well done!", "solved");
            } else {
                const remaining = pieceStates.filter(p => !p.placed).length;
                setStatus(`"${PIECE_NAMES[dragPieceIdx]}" placed · ${remaining} piece${remaining !== 1 ? "s" : ""} remaining`);
            }
        } else {
            setStatus("Can't place there — try rotating or a different spot", "error");
        }
    } else if (hit) {
        setStatus("Can't place there — cell is occupied or out of bounds");
    }

    cleanup();
}

function cleanup() {
    if (ghost) {
        ghost.style.display = "none";
        ghost.innerHTML = "";
    }
    dragPieceIdx = -1;
}

/* Convert screen coords → board [row,col] and check if piece fits */
function getHoveredBoardCell(cx, cy) {
    const boardSVG = document.getElementById("board");
    const ctm = boardSVG.getScreenCTM();
    if (!ctm) {
        return null;
    }

    // Convert screen → SVG coords
    const svgPt = boardSVG.createSVGPoint();
    svgPt.x = cx;
    svgPt.y = cy;
    const localPt = svgPt.matrixTransform(ctm.inverse());

    // Subtract the xOffset/yOffset baked into drawBoard
    const px = localPt.x;
    const py = localPt.y;

    // Try a small neighbourhood of candidate cells to find best snap
    // (axial coords can have floating-point ambiguity near edges)
    const colF = px / (1.5*HEX_RADIUS);
    const rowF = py / (Math.sqrt(3)*HEX_RADIUS) + colF/2;
    const candidates = [];
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            candidates.push([Math.round(rowF) + dr, Math.round(colF) + dc]);
        }
    }

    // The piece cells (relative axial offsets)
    const cells = ghost ? ghost.cells : [];

    for (const [row, col] of candidates) {
        // Check distance — reject if cursor is too far from any part of the cell
        const [cx2, cy2] = boardToPixel(col, row);
        const screenR = HEX_RADIUS * (boardSVG.getBoundingClientRect().width / parseFloat(boardSVG.getAttribute("viewBox")?.split(" ")[2] || 1));
        const dx = localPt.x - (cx2)
        const dy = localPt.y - (cy2);
        if (Math.hypot(dx, dy) > HEX_RADIUS * 2.5) {
            continue;
        }

        // Compute anchor so first cell maps to (row,col)
        const [dr0, dc0] = cells[0];
        const anchorRow = row - dr0;
        const anchorCol = col - dc0;

        // Check if all cells are valid & empty
        const toBoardCoords = cells.map(([dr, dc]) => [anchorRow + dr, anchorCol + dc]);
        let valid = true;
        for (const [r, c] of toBoardCoords) {
            if (r < 0 || r >= manualState.length ||
                c < 0 || c >= manualState[0].length ||
                manualState[r][c] !== 0) {

                    valid = false;
                    break;

                }
        }
        return {row, col, anchorRow, anchorCol, valid};
    }
    return null;
}

/* ═══════════════════════════════════════════════════════════
   UI wiring
═══════════════════════════════════════════════════════════ */
const selMonth = document.getElementById("selMonth");
const selDay = document.getElementById("selDay");
const selWeekday = document.getElementById("selWeekday");
const outputEl = document.getElementById("output");
const solveBtn = document.getElementById("solveButton");
const spinner2 = document.getElementById("spinner");
const solveIcon = document.getElementById("solveIcon");
const legendEl = document.getElementById("legend");

let isAutoSolved = false;

function buildDays() {
    for(let d = 1; d <= 31; d++) {
        const opt = document.createElement("option");
        opt.value = opt.textContent = String(d);
        selDay.appendChild(opt);
    }
}
buildDays();

function applyToday() {
    const n = new Date();
    selMonth.value = MONTHS[n.getMonth()];
    selDay.value = String(n.getDate());
    selWeekday.value = WEEKDAYS[n.getDay()];
}
applyToday();

function setStatus(msg, cls="") {
    outputEl.textContent = msg;
    outputEl.className = cls;
}

function drawInitial() {
    legendEl.innerHTML = "";
    initManualState();
    redrawBoard();
    renderTray();
    setStatus(`${selWeekday.value} · ${selMonth.value} ${selDay.value} — drag pieces onto the board`);
}

drawInitial();

selMonth.addEventListener("change", drawInitial);
selDay.addEventListener("change", drawInitial);
selWeekday.addEventListener("change", drawInitial);
document.getElementById("todayBtn").addEventListener("click", () => {
    applyToday();
    drawInitial();
});

document.getElementById("resetBtn").addEventListener("click", () => {
    legendEl.innerHTML = "";
    drawInitial();
});

solveBtn.addEventListener("click", () => {
    const m = selMonth.value;
    const d = selDay.value;
    const w = selWeekday.value;

    solveBtn.disabled = true;
    spinner2.style.display = "block";
    solveIcon.style.display = "none";
    setStatus(`Solving for ${w} · ${m} ${d}...`, "loading");
    legendEl.innerHTML = "";

    requestAnimationFrame(() => setTimeout(() => {
        const result = solveCalendar(m, d, w);
        solveBtn.disabled = false;
        spinner2.style.display = "none";
        solveIcon.style.display = "block";

        if (!result.solved) {
            setStatus(`No solution found for ${w} · ${m} ${d}`, "error");
            return;
        }

        // isAutoSolved = true;
        // Hide tray in auto-solve mode
        document.getElementById("trayWrap").style.opacity = "0.4";
        drawBoard(result.solution);
        setStatus(`✓ Solved! — ${w} · ${m} ${d}`, "solved");
        buildLegend();
    },30));
});

function buildLegend() {
    legendEl.innerHTML = "";
    PIECE_NAMES.forEach((name, i) => {
        const color = COLORS[String(i + 1)];
        if(!color) {
            return;
        }

        const item = document.createElement("div");
        item.className = "li";

        const sw = document.createElement("div");
        sw.className = "sw";
        sw.style.background = color;

        item.appendChild(sw);
        item.appendChild(document.createTextNode(name));
        legendEl.appendChild(item);
    });
    const exp = document.createElement("div");
    exp.className = "li";

    const sw2 = document.createElement("div");
    sw2.className = "sw";
    sw2.style.background = "black";
    sw2.style.border = "1px solid #666666";

    exp.appendChild(sw2);
    exp.appendChild(document.createTextNode("Exposed (month / day / weekday)"));
    legendEl.appendChild(exp);
}