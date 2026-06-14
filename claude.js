// ── Board layout ──────────────────────────────────────────────────────────────
// 7 columns x 8 rows  (cols 0-6, rows 0-7)
// Row 0: Jan Feb Mar Apr May Jun  [col 0-5]
// Row 1: Jul Aug Sep Oct Nov Dec  [col 0-5]
// Row 2: blank Sun Mon Tue Wed Thu Fri  (blank=col0, days col1-6)  -- actually let's do:
// Rows 0-1: months
// Rows 2-3: dates 1-16 (row2), 17-31 (row3) — but 31 cells across 2 rows needs 8+8 = 16 not 31
// Let me use the classic A-Frame layout:

// Board: 7 wide x 8 tall (56 cells). Some are "void" (padding).
// Row 0: Jan Feb Mar Apr May Jun  (6 cells, cols 0-5, col6=void)
// Row 1: Jul Aug Sep Oct Nov Dec  (6 cells, cols 0-5, col6=void)
// Row 2:  1   2   3   4   5   6   7  (dates, cols 0-6)
// Row 3:  8   9  10  11  12  13  14
// Row 4: 15  16  17  18  19  20  21
// Row 5: 22  23  24  25  26  27  28
// Row 6: 29  30  31  Sun Mon Tue Wed  (dates 29-31 then days cols 3-6)
// Row 7: (void) (void) (void) Thu Fri Sat (void)
// That gives: 6+6+7+7+7+7+7+3 = 50 date/month cells + 7 day cells = 57... close.
// Let's do a cleaner layout: 7 cols x 8 rows.

const COLS = 7, ROWS = 8;

// cell definitions: type = 'month'|'date'|'day'|'void'|'null'
// 'void' = out of board (invisible), 'null' = empty corner (blocked)
const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// Build grid labels: row,col -> { label, type }
function buildGrid() {
  const grid = [];
  for (let r = 0; r < ROWS; r++) {
    grid.push([]);
    for (let c = 0; c < COLS; c++) {
      grid[r].push(null);
    }
  }
  // Months: rows 0-1, cols 0-5 (6 each = 12)
  for (let i = 0; i < 12; i++) {
    const r = Math.floor(i / 6), c = i % 6;
    grid[r][c] = { label: months[i], type: 'month', idx: i };
  }
  // Dates 1-31: rows 2-5 fill 7 each = 28, row 6 cols 0-2 = 3 → 31 total
  for (let i = 1; i <= 31; i++) {
    const pos = i - 1;
    const r = 2 + Math.floor(pos / 7), c = pos % 7;
    grid[r][c] = { label: String(i), type: 'date', idx: i };
  }
  // Days: row 6 cols 3-6 + row 7 cols 0-2 (but let's put days in row 6 col3-6 and row7 col0-2)
  // row6 c3-6 = 4 days, row7 c0-2 = 3 days → 7 days
  for (let i = 0; i < 7; i++) {
    if (i < 4) { grid[6][3 + i] = { label: days[i], type: 'day', idx: i }; }
    else { grid[7][i - 4] = { label: days[i], type: 'day', idx: i }; }
  }
  // Mark voids
  grid[0][6] = { label: '', type: 'void' };
  grid[1][6] = { label: '', type: 'void' };
  grid[7][3] = { label: '', type: 'void' };
  grid[7][4] = { label: '', type: 'void' };
  grid[7][5] = { label: '', type: 'void' };
  grid[7][6] = { label: '', type: 'void' };
  return grid;
}

const GRID = buildGrid();

// ── Today's date ─────────────────────────────────────────────────────────────
const today = new Date();
const todayMonth = today.getMonth();    // 0-11
const todayDate  = today.getDate();     // 1-31
const todayDay   = today.getDay();      // 0=Sun..6=Sat

document.getElementById('dateDisplay').textContent =
  `${days[todayDay]}  ·  ${months[todayMonth]}  ·  ${todayDate}`;

// Cells that should remain EXPOSED (uncovered)
function isExposed(cell) {
  if (!cell || cell.type === 'void') return false;
  if (cell.type === 'month' && cell.idx === todayMonth) return true;
  if (cell.type === 'date'  && cell.idx === todayDate)  return true;
  if (cell.type === 'day'   && cell.idx === todayDay)   return true;
  return false;
}

// ── Pieces ────────────────────────────────────────────────────────────────────
// Each piece is defined as array of [row,col] offsets (normalized to top-left).
// 8 pieces covering 53 cells (56 - 3 exposed - any voids = depends on day).
// Total non-void, non-exposed cells = count manually.
// Void cells: (0,6),(1,6),(7,3),(7,4),(7,5),(7,6) = 6 void
// Board cells = 56 - 6 = 50 usable cells, minus 3 exposed = 47 to cover.
// We'll define 8 pieces of varying sizes (total 47 cells).

const PIECE_DEFS = [
  // Name, cells, color
  { name:'L4', color:'#4a7cc7', cells: [[0,0],[1,0],[2,0],[2,1]] },                           // L tetromino
  { name:'J4', color:'#7c4ab8', cells: [[0,0],[0,1],[1,0],[2,0]] },                           // J tetromino
  { name:'S5', color:'#c74a4a', cells: [[0,0],[1,0],[1,1],[2,1],[2,2]] },                     // S pentomino
  { name:'L5', color:'#4a9e6a', cells: [[0,0],[1,0],[2,0],[3,0],[3,1]] },                     // L pentomino
  { name:'P5', color:'#c48a2a', cells: [[0,0],[0,1],[1,0],[1,1],[2,0]] },                     // P pentomino
  { name:'Y5', color:'#2a9ec4', cells: [[0,0],[1,0],[1,1],[2,0],[3,0]] },                     // Y pentomino
  { name:'N6', color:'#9e6a2a', cells: [[0,0],[0,1],[0,2],[1,2],[1,3],[1,4]] },               // 6-cell L-shape
  { name:'U6', color:'#c43a8a', cells: [[0,0],[0,1],[0,2],[1,0],[1,2],[2,0]] },               // 6-cell U/Z
  { name:'T6', color:'#3a8ac4', cells: [[0,0],[0,1],[0,2],[1,1],[2,1],[3,1]] },               // T-like 6
  { name:'W5', color:'#6a4ac4', cells: [[0,0],[0,1],[1,1],[1,2],[2,2]] },                     // W pentomino
];

// Total cells in pieces: 4+4+5+5+5+5+6+6+6+5 = 51... we need 47 (varies by date).
// Actually for a proper puzzle we need pieces summing to exactly (50 - 3) = 47.
// 4+4+5+5+5+5 = 28, need 19 more → 3 pieces of ~6. 28+6+6+7=47? Let's pick pieces summing to 47.
// 4+4+5+5+5+5+6+6+7 = 47. Let's redefine piece 8 as 7-cell.

// Actually the classic A-Frame puzzle uses 8 pieces: let's just do 8 pieces totaling ~47.
// We'll work with 9 pieces: sizes 4,4,5,5,5,5,6,6,7 = 47. ✓

const PIECES_RAW = [
  { name:'L', color:'#5b8dd9', cells: [[0,0],[1,0],[2,0],[2,1]] },
  { name:'J', color:'#8b5bd9', cells: [[0,1],[1,1],[2,0],[2,1]] },
  { name:'S', color:'#d95b5b', cells: [[0,0],[1,0],[1,1],[2,1],[2,2]] },
  { name:'Z', color:'#5bd97a', cells: [[0,1],[0,2],[1,0],[1,1],[2,0]] },
  { name:'P', color:'#d9a85b', cells: [[0,0],[0,1],[1,0],[1,1],[2,1]] },
  { name:'Y', color:'#5bd9d9', cells: [[0,0],[1,0],[1,1],[2,0],[3,0]] },
  { name:'U', color:'#d95baa', cells: [[0,0],[0,2],[1,0],[1,1],[1,2],[2,0]] },
  { name:'F', color:'#9b8b3b', cells: [[0,1],[0,2],[1,0],[1,1],[2,1],[2,2]] },
  { name:'T', color:'#3b9b8b', cells: [[0,0],[0,1],[0,2],[1,1],[2,0],[2,1],[2,2]] },
];

// Normalize cells: shift so min-row=0, min-col=0
function normalizeCells(cells) {
  const minR = Math.min(...cells.map(c=>c[0]));
  const minC = Math.min(...cells.map(c=>c[1]));
  return cells.map(c => [c[0]-minR, c[1]-minC]);
}

// Rotate cells 90° clockwise
function rotateCW(cells) {
  const maxR = Math.max(...cells.map(c=>c[0]));
  return normalizeCells(cells.map(([r,c]) => [c, maxR-r]));
}

function rotateCCW(cells) {
  const maxC = Math.max(...cells.map(c=>c[1]));
  return normalizeCells(cells.map(([r,c]) => [maxC-c, r]));
}

// ── State ─────────────────────────────────────────────────────────────────────
let pieces = PIECES_RAW.map((p,i) => ({
  ...p,
  id: i,
  cells: normalizeCells(p.cells),
  rotation: 0,  // 0,1,2,3 × 90°
  placed: false,
  boardRow: -1,
  boardCol: -1,
}));

let selectedPieceId = null;
let boardState = Array.from({length:ROWS}, ()=>Array(COLS).fill(null)); // null or pieceId

// ── Render board ──────────────────────────────────────────────────────────────
const boardEl = document.getElementById('board');
const CS = () => parseInt(getComputedStyle(document.documentElement).getPropertyValue('--cell-size'));
const GAP = () => parseInt(getComputedStyle(document.documentElement).getPropertyValue('--gap')) || 3;

function renderBoard() {
  const cs = CS(), gap = GAP();
  boardEl.style.gridTemplateColumns = `repeat(${COLS}, ${cs}px)`;
  boardEl.style.gridTemplateRows = `repeat(${ROWS}, ${cs}px)`;
  boardEl.style.gap = `${gap}px`;
  boardEl.innerHTML = '';
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = GRID[r][c];
      const div = document.createElement('div');
      div.className = 'cell';
      div.dataset.r = r;
      div.dataset.c = c;
      if (!cell || cell.type === 'void') {
        div.classList.add('blocked');
        div.style.width = cs + 'px';
        div.style.height = cs + 'px';
        boardEl.appendChild(div);
        continue;
      }
      div.style.width = cs + 'px';
      div.style.height = cs + 'px';
      if (isExposed(cell)) {
        div.classList.add('exposed');
        div.textContent = cell.label;
      } else if (boardState[r][c] !== null) {
        div.classList.add('covered');
        const pid = boardState[r][c];
        const p = pieces[pid];
        div.style.background = p.color;
        div.style.borderColor = shadeColor(p.color, -30);
        // Show piece name on first cell
        const pCells = p.cells.map(([dr,dc]) => [p.boardRow+dr, p.boardCol+dc]);
        const sorted = [...pCells].sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
        if (sorted[0][0]===r && sorted[0][1]===c) {
          div.textContent = p.name;
          div.style.fontSize = '9px';
          div.style.color = 'rgba(255,255,255,0.6)';
          div.style.fontWeight = '700';
        }
        // Click covered cell to remove piece
        div.style.cursor = 'pointer';
        div.title = 'Click to remove piece';
        div.addEventListener('click', () => removePiece(pid));
      } else {
        div.textContent = cell.label;
      }
      boardEl.appendChild(div);
    }
  }
  checkWin();
}

function shadeColor(hex, pct) {
  const n = parseInt(hex.replace('#',''), 16);
  const r = Math.min(255, Math.max(0, (n>>16) + pct));
  const g = Math.min(255, Math.max(0, ((n>>8)&0xff) + pct));
  const b = Math.min(255, Math.max(0, (n&0xff) + pct));
  return '#' + [r,g,b].map(x=>x.toString(16).padStart(2,'0')).join('');
}

// ── Render tray ───────────────────────────────────────────────────────────────
const trayEl = document.getElementById('trayGrid');

function renderTray() {
  trayEl.innerHTML = '';
  const cs = Math.min(CS(), 34);
  const gap = 2;
  pieces.forEach(p => {
    if (p.placed) return;
    const maxR = Math.max(...p.cells.map(c=>c[0]));
    const maxC = Math.max(...p.cells.map(c=>c[1]));
    const w = (maxC+1)*cs + maxC*gap;
    const h = (maxR+1)*cs + maxR*gap;
    const wrap = document.createElement('div');
    wrap.className = 'piece-container';
    wrap.dataset.pid = p.id;
    wrap.style.width  = w + 'px';
    wrap.style.height = h + 'px';
    wrap.style.position = 'relative';
    if (selectedPieceId === p.id) {
      wrap.style.outline = `2px solid var(--piece-selected-ring)`;
      wrap.style.borderRadius = '4px';
    }
    p.cells.forEach(([r,c]) => {
      const cell = document.createElement('div');
      cell.className = 'piece-cell';
      cell.style.width  = cs + 'px';
      cell.style.height = cs + 'px';
      cell.style.background = p.color;
      cell.style.borderColor = shadeColor(p.color, -30);
      cell.style.position = 'absolute';
      cell.style.left = (c*(cs+gap)) + 'px';
      cell.style.top  = (r*(cs+gap)) + 'px';
      wrap.appendChild(cell);
    });
    wrap.addEventListener('click', (e) => {
      e.stopPropagation();
      selectPiece(p.id);
    });
    wrap.addEventListener('mousedown', (e) => startDrag(e, p.id));
    wrap.addEventListener('touchstart', (e) => startDrag(e, p.id), {passive:false});
    trayEl.appendChild(wrap);
  });
  // Update selected label
  const lbl = document.getElementById('selectedLabel');
  if (selectedPieceId !== null) {
    const p = pieces[selectedPieceId];
    lbl.textContent = p ? `"${p.name}"` : 'none';
  } else {
    lbl.textContent = 'none';
  }
}

function selectPiece(id) {
  selectedPieceId = id;
  document.getElementById('msg').textContent = 'Drag the piece onto the board, or use scroll / buttons to rotate';
  renderTray();
}

// ── Rotation ──────────────────────────────────────────────────────────────────
function rotatePiece(id, dir) {
  const p = pieces[id];
  if (!p) return;
  if (dir === 'cw')  p.cells = rotateCW(p.cells);
  if (dir === 'ccw') p.cells = rotateCCW(p.cells);
  renderTray();
}

document.getElementById('btnCW').addEventListener('click',  () => { if (selectedPieceId!==null) rotatePiece(selectedPieceId,'cw'); });
document.getElementById('btnCCW').addEventListener('click', () => { if (selectedPieceId!==null) rotatePiece(selectedPieceId,'ccw'); });

// Scroll wheel rotation
document.addEventListener('wheel', (e) => {
  if (selectedPieceId === null) return;
  e.preventDefault();
  rotatePiece(selectedPieceId, e.deltaY > 0 ? 'cw' : 'ccw');
}, { passive: false });

// ── Drag & Drop ───────────────────────────────────────────────────────────────
let dragState = null;

function startDrag(e, pid) {
  e.preventDefault();
  selectPiece(pid);
  const p = pieces[pid];
  const cs = CS(), gap = GAP();

  let clientX, clientY;
  if (e.touches) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; }
  else { clientX = e.clientX; clientY = e.clientY; }

  // Create floating ghost
  const ghost = document.createElement('div');
  ghost.className = 'dragging-piece';
  const maxR = Math.max(...p.cells.map(c=>c[0]));
  const maxC = Math.max(...p.cells.map(c=>c[1]));
  ghost.style.width  = ((maxC+1)*cs + maxC*gap) + 'px';
  ghost.style.height = ((maxR+1)*cs + maxR*gap) + 'px';
  ghost.style.position = 'fixed';
  ghost.style.pointerEvents = 'none';
  ghost.style.zIndex = 9999;
  ghost.style.position = 'fixed';

  p.cells.forEach(([r,c]) => {
    const cell = document.createElement('div');
    cell.className = 'piece-cell';
    cell.style.width  = cs+'px'; cell.style.height = cs+'px';
    cell.style.background = p.color;
    cell.style.borderColor = shadeColor(p.color,-30);
    cell.style.position = 'absolute';
    cell.style.left = (c*(cs+gap))+'px'; cell.style.top = (r*(cs+gap))+'px';
    ghost.appendChild(cell);
  });
  document.body.appendChild(ghost);

  const offsetX = -(Math.max(...p.cells.map(c=>c[1]))+1)*(cs+gap)/2;
  const offsetY = -(Math.max(...p.cells.map(c=>c[0]))+1)*(cs+gap)/2;

  dragState = { pid, ghost, offsetX, offsetY };
  moveGhost(clientX, clientY);
}

function moveGhost(cx, cy) {
  if (!dragState) return;
  const { ghost, offsetX, offsetY } = dragState;
  ghost.style.left = (cx + offsetX) + 'px';
  ghost.style.top  = (cy + offsetY) + 'px';
}

function getBoardCellAt(cx, cy) {
  const boardRect = boardEl.getBoundingClientRect();
  if (cx < boardRect.left || cx > boardRect.right || cy < boardRect.top || cy > boardRect.bottom) return null;
  const cs = CS(), gap = GAP();
  const pad = 8; // board padding
  const relX = cx - boardRect.left - pad;
  const relY = cy - boardRect.top  - pad;
  const col = Math.floor(relX / (cs + gap));
  const row = Math.floor(relY / (cs + gap));
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return null;
  return { row, col };
}

function snapToGrid(cx, cy) {
  if (!dragState) return;
  const { pid } = dragState;
  const p = pieces[pid];
  const hit = getBoardCellAt(cx, cy);
  if (!hit) return false;

  // Try to place top-left of piece at (hit.row, hit.col)
  // Find piece anchor = top-left cell
  const minR = Math.min(...p.cells.map(c=>c[0]));
  const minC = Math.min(...p.cells.map(c=>c[1]));
  const baseRow = hit.row - minR;
  const baseCol = hit.col - minC;

  return tryPlace(pid, baseRow, baseCol);
}

function tryPlace(pid, baseRow, baseCol) {
  const p = pieces[pid];
  const cells = p.cells.map(([r,c]) => [baseRow+r, baseCol+c]);

  for (const [r,c] of cells) {
    if (r<0||r>=ROWS||c<0||c>=COLS) return false;
    const cell = GRID[r][c];
    if (!cell || cell.type==='void') return false;
    if (isExposed(cell)) return false;
    if (boardState[r][c] !== null) return false;
  }
  // Place it
  cells.forEach(([r,c]) => boardState[r][c] = pid);
  p.placed = true;
  p.boardRow = baseRow;
  p.boardCol = baseCol;
  if (selectedPieceId === pid) selectedPieceId = null;
  return true;
}

function removePiece(pid) {
  const p = pieces[pid];
  if (!p.placed) return;
  // Remove from board
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) {
    if (boardState[r][c]===pid) boardState[r][c]=null;
  }
  p.placed = false;
  p.boardRow = -1;
  p.boardCol = -1;
  document.getElementById('msg').textContent = `"${p.name}" returned to tray`;
  renderBoard();
  renderTray();
}

document.addEventListener('mousemove', e => {
  if (!dragState) return;
  moveGhost(e.clientX, e.clientY);
});
document.addEventListener('touchmove', e => {
  if (!dragState) return;
  e.preventDefault();
  moveGhost(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: false });

document.addEventListener('mouseup', e => endDrag(e.clientX, e.clientY));
document.addEventListener('touchend', e => {
  if (!dragState) return;
  const t = e.changedTouches[0];
  endDrag(t.clientX, t.clientY);
});

function endDrag(cx, cy) {
  if (!dragState) return;
  const { ghost, pid } = dragState;
  ghost.remove();
  const placed = snapToGrid(cx, cy);
  dragState = null;
  if (placed) {
    document.getElementById('msg').textContent = `Piece placed! ${pieces.filter(p=>p.placed).length}/${pieces.length} placed.`;
  } else {
    document.getElementById('msg').textContent = 'Piece returned — try a different position or rotation';
  }
  renderBoard();
  renderTray();
}

// ── Win check ─────────────────────────────────────────────────────────────────
function checkWin() {
  // All non-void, non-exposed cells should be covered
  for (let r=0;r<ROWS;r++) {
    for (let c=0;c<COLS;c++) {
      const cell = GRID[r][c];
      if (!cell || cell.type==='void') continue;
      if (isExposed(cell)) continue;
      if (boardState[r][c]===null) return false;
    }
  }
  const msg = document.getElementById('msg');
  msg.textContent = '🎉 Puzzle solved! The board is complete!';
  msg.classList.add('win');
  return true;
}

// ── Reset ─────────────────────────────────────────────────────────────────────
document.getElementById('btnReset').addEventListener('click', () => {
  boardState = Array.from({length:ROWS}, ()=>Array(COLS).fill(null));
  pieces = PIECES_RAW.map((p,i) => ({
    ...p, id: i,
    cells: normalizeCells(p.cells.map(c=>[...c])),
    placed: false, boardRow:-1, boardCol:-1,
  }));
  selectedPieceId = null;
  document.getElementById('msg').textContent = 'Board reset — good luck!';
  document.getElementById('msg').classList.remove('win');
  renderBoard();
  renderTray();
});

// ── Hint ──────────────────────────────────────────────────────────────────────
document.getElementById('btnSolveHint').addEventListener('click', () => {
  // Find first empty valid cell and highlight it
  const empties = [];
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) {
    const cell=GRID[r][c];
    if (cell && cell.type!=='void' && !isExposed(cell) && boardState[r][c]===null) empties.push([r,c]);
  }
  if (empties.length===0) return;
  // Try to find a placement for any unplaced piece
  const unplaced = pieces.filter(p=>!p.placed);
  if (unplaced.length===0) return;
  const msg = document.getElementById('msg');
  for (const p of unplaced) {
    for (let rot=0;rot<4;rot++) {
      for (const [er,ec] of empties) {
        for (const [dr,dc] of p.cells) {
          const br=er-dr, bc=ec-dc;
          const testCells = p.cells.map(([r,c])=>[br+r,bc+c]);
          let ok=true;
          for (const [r,c] of testCells) {
            if (r<0||r>=ROWS||c<0||c>=COLS){ok=false;break;}
            const cell=GRID[r][c];
            if (!cell||cell.type==='void'||isExposed(cell)||(boardState[r][c]!==null)){ok=false;break;}
          }
          if (ok) {
            selectPiece(p.id);
            msg.textContent = `Hint: piece "${p.name}" can fit starting at row ${er+1}, col ${ec+1}`;
            return;
          }
        }
      }
      p.cells = rotateCW(p.cells);
    }
  }
  msg.textContent = 'No immediate placement found — try rotating pieces!';
});

// Click outside deselects
document.addEventListener('click', e => {
  if (!e.target.closest('.piece-container') && !e.target.closest('.btn')) {
    // don't deselect on board click
  }
});

// ── Init ──────────────────────────────────────────────────────────────────────
renderBoard();
renderTray();