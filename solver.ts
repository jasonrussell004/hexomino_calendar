const start: number = performance.now();

type Coord = [number, number];

type Solution = number[][];

type Board = (string | null)[][];

const BOARD: Board = [
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

const PIECES: Record<string, Coord[]> = {
    "Elbow": [[0,0], [1,0], [1,1]],
    "3-Line": [[0,0], [1,0], [2,0]],
    "Triangle": [[0,0], [1,0], [2,1]],
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

function generateUniqueRotations(basePiece: Coord[]): Coord[][] {

    const rotations: Coord[][] = [];
    const seen = new Set<string>();

    let currentPiece = basePiece.map(c => [...c] as Coord);

    for (let i = 0; i < 6; i++) {

        const rotated: Coord[] =
            currentPiece.map(([x,y]) => [x - y, x]);

        const [firstX, firstY] = rotated[0];

        const anchored: Coord[] =
            rotated.map(([x,y]) =>
                [x - firstX, y - firstY]);

        const minX =
            Math.min(...anchored.map(([x]) => x));

        const minY =
            Math.min(...anchored.map(([,y]) => y));

        const normalized =
            anchored
                .map(([x,y]) => [x-minX, y-minY])
                .sort();

        const key = JSON.stringify(normalized);

        if (!seen.has(key)) {
            seen.add(key);
            rotations.push(anchored);
        }

        currentPiece = rotated;
    }

    return rotations;
}

const PIECE_ROTATIONS: Record<string, Coord[][]> = Object.fromEntries(
    Object.entries(PIECES).map(([name, coords]) => [
        name,
        generateUniqueRotations(coords)
    ])
);



class PuzzleSolver {

    solution: Solution;
    usedPieces: Record<string, boolean>;

    rows: number;
    cols: number;

    constructor(
        private board: Board,
        private targetMonth: string,
        private targetDay: string,
        private targetWeekday: string
    ) {

        this.rows = board.length;
        this.cols = board[0].length;

        this.solution = [];
        this.usedPieces = {};

        this.solverSetup();
    }

    solverSetup() {

        this.solution =
            Array.from(
                { length: this.rows },
                () => Array(this.cols).fill(0)
            );

        for (let r = 0; r < this.rows; r++) {

            for (let c = 0; c < this.cols; c++) {

                const val = this.board[r][c];

                if (val === null) {
                    this.solution[r][c] = -1;
                }
                else if (
                    val === this.targetMonth ||
                    val === this.targetDay ||
                    val === this.targetWeekday
                ) {
                    this.solution[r][c] = -2;
                }
            }
        }

        this.usedPieces = {};

        for (const name of Object.keys(PIECES)) {
            this.usedPieces[name] = false;
        }
    }

    hasUnfillableHoles(): boolean {

        const visited =
            Array.from(
                { length: this.rows },
                () => Array(this.cols).fill(false)
            );

        const neighbors = [
            [-1,0],
            [1,0],
            [0,-1],
            [0,1],
            [1,1],
            [-1,-1]
        ];

        for (let r=0;r<this.rows;r++) {

            for (let c=0;c<this.cols;c++) {

                if (
                    this.solution[r][c] !== 0 ||
                    visited[r][c]
                ) {
                    continue;
                }

                let size = 0;

                const queue: Coord[] = [[r,c]];

                visited[r][c] = true;

                while (queue.length) {

                    const [cr,cc] = queue.shift()!;

                    size++;

                    for (const [dr,dc] of neighbors) {

                        const nr = cr + dr;
                        const nc = cc + dc;

                        if (
                            nr >= 0 &&
                            nr < this.rows &&
                            nc >= 0 &&
                            nc < this.cols &&
                            this.solution[nr][nc] === 0 &&
                            !visited[nr][nc]
                        ) {
                            visited[nr][nc] = true;
                            queue.push([nr,nc]);
                        }
                    }
                }

                if ([1,2,5,7].includes(size))
                    return true;
            }
        }

        return false;
    }

    solve(): boolean {

        if (this.hasUnfillableHoles())
            return false;

        let target: Coord | null = null;

        for (let r=0;r<this.rows;r++) {

            for (let c=0;c<this.cols;c++) {

                if (this.solution[r][c] === 0) {
                    target = [r,c];
                    break;
                }
            }

            if (target) break;
        }

        if (!target)
            return true;

        const [rTarget,cTarget] = target;

        for (const [idx,name] of
        Object.keys(this.usedPieces).entries()) {

        if (this.usedPieces[name])
            continue;

        for (const orientation of
            PIECE_ROTATIONS[name]) {

            for (const [rPivot,cPivot]
                of orientation) {

                const placed: Coord[] = [];

                let canPlace = true;

                for (const [dx,dy]
                    of orientation) {

                    const nr =
                        rTarget + dx - rPivot;

                    const nc =
                        cTarget + dy - cPivot;

                    if (
                        nr >= 0 &&
                        nr < this.rows &&
                        nc >= 0 &&
                        nc < this.cols &&
                        this.solution[nr][nc] === 0
                    ) {
                        placed.push([nr,nc]);
                    }
                    else {
                        canPlace = false;
                        break;
                    }
                }

                if (!canPlace)
                    continue;

                for (const [pr,pc] of placed) {
                    this.solution[pr][pc] = idx + 1;
                }

                this.usedPieces[name] = true;

                if (this.solve())
                    return true;

                this.usedPieces[name] = false;

                for (const [pr,pc] of placed) {
                    this.solution[pr][pc] = 0;
                }
            }
        }
    }
    
    return false;
    
    }

}

const SOLUTION: Solution = [
    [1, 1, 2, -1, -1, -1, -1, -1],
    [3, 1, 5, 2, -1, -1, -1, -1],
    [9, 3, 5, -2, 2, -1, -1, -1],
    [9, 3, 5, 4, 8, 8, -1, -1],
    [-1, 9, 5, 4, 4, 8, -1, -1],
    [-1, 11, 9, -2, 4, 13, 8, -1],
    [-1, -1, 11, 11, 13, 13, 10, -1],
    [-1, -1, 6, 6, 11, 12, 13, 10],
    [-1, -1, -1, -2, 6, 7, 12, 10],
    [-1, -1, -1, -1, 6, 7, 12, 10],
    [-1, -1, -1, -1, -1, 7, 7, 12]
];

const solver = new PuzzleSolver(
    BOARD,
    "21",
    "May",
    "Thu"
);

function are2DArraysEqual<T>(arr1: T[][], arr2: T[][]): boolean {
    // Check if they point to the exact same memory reference
    if (arr1 === arr2) return true;

    // Check if the outer array lengths match
    if (arr1.length !== arr2.length) return false;

    // Compare inner arrays
    return arr1.every((row, i) => {
        const targetRow = arr2[i];
        
        // Check if inner array lengths match
        if (row.length !== targetRow.length) return false;
        
        // Compare every primitive element in the row
        return row.every((val, j) => val === targetRow[j]);
    });
}

// console.table(solver.solution);
// console.table(BOARD);

solver.solve();
console.table(solver.solution);

console.log(are2DArraysEqual(solver.solution, SOLUTION))


const end: number = performance.now();
const duration: number = end - start;

console.log(`Execution time: ${duration.toFixed(4)} ms`);
