"use strict";

const BOARD = [
    [  "7",    "",  "20",  null,  null,  null,  null,  null],
    ["Jan",   "9",  "15", "Jul",  null,  null,  null,  null],
    ["Feb", "Mon",  "11",  "21", "Aug",  null,  null,  null],
    ["Mar",   "4", "Tue",  "16",  "26", "Sep",  null,  null],
    [ null,   "2", "Wed",  "12",  "22",  "29",  null,  null],
    [ null,   "1",   "5", "Thu",  "17",  "27",  "31",  null],
    [ null,  null,   "3", "Fri",  "13",  "23",  "30",  null],
    [ null,  null, "Apr",   "6", "Sat",  "18",  "28", "Oct"],
    [ null,  null,  null, "May", "Sun",  "14",  "24", "Nov"],
    [ null,  null,  null,  null, "Jun",  "10",  "19", "Dec"],
    [ null,  null,  null,  null,  null,   "8",    "",  "25"],
];

function boardToSolution(board, targetMonth, targetDay, targetWeekday) {
    const rows = board.length;
    const cols = board[0].length;

    const solution = Array.from({length: rows}, () => Array(cols).fill(0));

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const val = board[r][c];

            if (val === null) {
                solution[r][c] = -1;
            } else if (val === targetMonth ||
                       val === targetDay ||
                       val === targetWeekday) {
                solution[r][c] = -2;
            }
        }
    }
    
    return solution;
}

const PIECES = {
             "Elbow": [[0,0], [1,0], [2,1]],
            "3-Line": [[0,0], [1,0], [2,0]],
          "Triangle": [[0,0], [1,0], [1,1]],
           "Rhombus": [[0,0], [1,0], [1,1], [0,1]],
            "4-Line": [[0,0], [1,0], [2,0], [3,0]],
                 "C": [[0,0], [1,0], [2,1], [2,2]],
                 "P": [[0,0], [1,0], [2,0], [2,1]],
          "Mirror P": [[0,0], [0,1], [0,2], [1,2]],
                 "L": [[0,0], [0,1], [0,2], [1,3]],
          "Mirror L": [[0,0], [0,1], [0,2], [1,0]],
           "Zig-Zag": [[0,0], [1,0], [2,1], [3,1]],
    "Mirror Zig-Zag": [[0,0], [1,1], [2,1], [3,2]],
          "Triforce": [[0,0], [1,1], [2,1], [1,2]]
};

function generateUniqueRotations(basePiece) {
    const rotations = [];
    const seen = new Set();

    let currentPiece = basePiece.map(c => [...c]);

    for (let i = 0; i < 6; i++) {
        const rotated = currentPiece.map(([x, y]) => [x - y, x]);

        const [x0, y0] = rotated[0];

        const anchored = rotated.map(([x, y]) => [x - x0, y - y0]);
        
        const minX = Math.min(...anchored.map(([x]) => x));

        const minY = Math.min(...anchored.map(([,y]) => y));

        const normalized = anchored.map(([x, y]) => [x - minX, y - minY]).sort();

        const key = JSON.stringify(normalized);

        if (!seen.has(key)) {
            seen.add(key);
            rotations.push(anchored);
        }

        currentPiece = rotated;
    }

    return rotations;
}

const PIECE_ROTATIONS = Object.fromEntries(
    Object.entries(PIECES).map(([name, coords]) => [name, generateUniqueRotations(coords)])
);

const NEIGHBOR_COORDS = [[-1,0], [1,0], [0,-1], [0,1], [1,1], [-1,-1]];

class PuzzleSolver {
    constructor(board, targetMonth, targetDay, targetWeekday) {
        this.board = board;

        this.targetMonth = targetMonth;
        this.targetDay = targetDay;
        this.targetWeekday = targetWeekday;

        this.rows = board.length;
        this.cols = board[0].length;

        this.solution = [];
        this.usedPieces = {};

        this.solverSetup();
    }

    solverSetup() {
        this.solution = boardToSolution(BOARD, this.targetMonth, this.targetDay, this.targetWeekday);
        this.usedPieces = Object.fromEntries(Object.entries(PIECES).map(([name]) => [name, false]));
    }

    hasUnfillableHoles() {
        const visited = Array.from({length: this.rows}, () => Array(this.cols).fill(false));

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.solution[r][c] !== 0 || visited[r][c]) {
                    continue;
                }

                let size = 0;
                const queue = [[r, c]];
                visited[r][c] = true;

                while (queue.length) {
                    const [cr, cc] = queue.shift();
                    size++;
                    
                    for (const [dr, dc] of NEIGHBOR_COORDS) {
                        const nr = cr + dr;
                        const nc = cc + dc;

                        if (nr >= 0 && nr < this.rows &&
                            nc >= 0 && nc < this.cols &&
                            this.solution[nr][nc] === 0 &&
                            !visited[nr][nc]) {
                                
                            visited[nr][nc] = true;
                            queue.push([nr, nc]);
                        
                        }
                    }
                }

                if ([1, 2, 5, 7].includes(size)) {
                    return true;
                }
            }
        }

        return false;
    }

    solve() {
        if (this.hasUnfillableHoles()) {
            return false;
        }

        let target = null;
        for (let r = 0; r < this.rows && !target; r++) {
            for (let c = 0; c < this.cols && !target; c++) {
                if (this.solution[r][c] === 0) {
                    target = [r, c];
                }
            }
        }

        if (!target) {
            return true;
        }

        const [rTarget, cTarget] = target;

        for (const [idx, name] of Object.keys(this.usedPieces).entries()) {
            if (this.usedPieces[name]) {
                continue;
            }

            for (const orientation of PIECE_ROTATIONS[name]) {
                for (const [rPivot, cPivot] of orientation) {
                    const placed = [];
                    let canPlace = true;

                    for (const [dx, dy] of orientation) {
                        const nr = rTarget + dx - rPivot;
                        const nc = cTarget + dy - cPivot;

                        if (nr >= 0 && nr < this.rows &&
                            nc >= 0 && nc < this.cols &&
                            this.solution[nr][nc] === 0) {
                            
                            placed.push([nr, nc]);

                        } else {
                            canPlace = false;
                            break;
                        }
                    }

                    if (!canPlace) {
                        continue;
                    }

                    for (const [pr, pc] of placed) {
                        this.solution[pr][pc] = idx + 1;
                    }

                    this.usedPieces[name] = true;

                    if (this.solve()) {
                        return true;
                    }

                    this.usedPieces[name] = false;

                    for (const [pr, pc] of placed) {
                        this.solution[pr][pc] = 0;
                    }
                }
            }
        }

        return false;
    }
}

function solveCalendar(month, day, weekday) {
    const solver = new PuzzleSolver(BOARD, month, day, weekday);
    const solved = solver.solve();
    return {
        solved: solved,
        solution: solver.solution
    };
}