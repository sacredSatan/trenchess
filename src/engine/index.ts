import pc from "picocolors";

// board is 64 0s, each piece can be represented by an int
// 6 pieces to represent p, r, n, b, q, k, 2 states (b/w), n number of modifiers?
// 4th & 5th binary digit represents the black/white state (8 white, 16 black)
// inspired by Sebastian Lague's first Chess video, I haven't looked much into how these engines
// are generally built/represented, so I could be doing something suboptimal.
// https://www.youtube.com/watch?v=U4ogK0MIzqk
// 
// I must also mention OneLoneCoder's excellent first video on NES emulators that focuses on Bitwise basics 
// https://www.youtube.com/watch?v=F8kx56OZQhg
enum PIECES {
  PAWN = 0b00_001,
  ROOK = 0b00_010,
  BISHOP = 0b00_011,
  KNIGHT = 0b00_100,
  QUEEN = 0b00_101,
  KING = 0b00_110,
  EN_PASSANT = 0b00_111,
  WHITE = 0b01_000,
  BLACK = 0b10_000,
  EMPTY = 0,
}

// I'm not sure how many modifiers are going to end up being in the game, but I can just append data to the left
enum TILE_MODIFIERS {
  // this is where it gets its name, it has to be the first one in the list
  TRENCH = 0b0001_00000,

  // this one actually occupies two places in the board, might have to change how this works
  // PORTAL being 64 reminds me of Portal64, a demake of portal for N64 by James Lambert
  // !! a singular value can work if the game doesn't care about where does a particular portal open, who placed it
  // imagine all portal holes being interconnected, this will raise stakes but I didn't have it in mind when I initially thought of portals
  // I'd imagined them to work like real valve's portal
  PORTAL = 0b0010_00000,

  // some modifiers have additional state (like the modifier that prevents a certain class of pieces from occupying a square)
  // it'd been nice to have represented the whole game state with just 64 numbers (+1 for player states)
  // I'm still going to try to stretch this as much as I can
  // pawn and knights can go anywhere
  ROYALTY_ONLY = 0b0011_00000,
  ROOK_ONLY = 0b0100_00000,
  BISHOP_ONLY = 0b0101_00000,

  // treating valid en passant as a modifier for now
  // didn't do it this way after all
  // EN_PASSANT    = 0b1_00000000,
}

enum BOARD_MASKS {
  PIECES = 0b111,
  COLOUR = 0b11_000,
  PIECE_W_COLOUR = 0b11111,
  MODIFIERS = 0b1111_00000,
}

// currently thinking of representing the game state in a single number for both white and black
// what I think I need to keep track of
// castles: (only keep track of whether a king side / queen side castle is allowed)
// 2 illegal counters, game turn
// have to do promotions too at some point
enum GAME_STATE {
  WHITE_TURN = 0b0,
  BLACK_TURN = 0b1,
  CASTLE = 0b1111_0,
  ILLEGAL_COUNTER = 0b11_0000_0,
}

enum GAME_STATE_MASKS {
  TURN = 0b1,
  W_ILLEGAL = 0b01_0000_0,
  B_ILLEGAL = 0b10_0000_0,
  BQ_CASTLE = 0b0001_0,
  BK_CASTLE = 0b0010_0,
  WQ_CASTLE = 0b0100_0,
  WK_CASTLE = 0b1000_0,
}

const MODIFIER_INDEX = {
  "0": TILE_MODIFIERS.TRENCH,
  "1": TILE_MODIFIERS.PORTAL,
  "2": TILE_MODIFIERS.ROYALTY_ONLY,
  "3": TILE_MODIFIERS.BISHOP_ONLY,
  "4": TILE_MODIFIERS.ROOK_ONLY,
} as Record<string, number>;

const MODIFIER_COLOR = {
  [TILE_MODIFIERS.TRENCH]: pc.bgYellow,
  [TILE_MODIFIERS.PORTAL]: pc.bgBlue,
  [TILE_MODIFIERS.ROYALTY_ONLY]: pc.bgMagenta,
  [TILE_MODIFIERS.BISHOP_ONLY]: pc.bgGreen,
  [TILE_MODIFIERS.ROOK_ONLY]: pc.bgCyan,
};

const DEFAULT_ORDER = [
  PIECES.ROOK, PIECES.KNIGHT, PIECES.BISHOP, PIECES.QUEEN, PIECES.KING, PIECES.BISHOP, PIECES.KNIGHT, PIECES.ROOK
];

// white's turn
const DEFAULT_GAME_STATE = GAME_STATE.WHITE_TURN;
// 64 tiles, 65th being the game state
const DEFAULT_STATE = [
  // white's pieces
  ...DEFAULT_ORDER.map((piece) => (piece | PIECES.WHITE)),
  ...new Array(8).fill(PIECES.PAWN | PIECES.WHITE),
  // 4 empty rows
  ...new Array(32).fill(PIECES.EMPTY),
  // black's pieces
  ...new Array(8).fill(PIECES.PAWN | PIECES.BLACK),
  ...DEFAULT_ORDER.map((piece) => (piece | PIECES.BLACK)),

  // game state
  DEFAULT_GAME_STATE,
];

const COLUMNS = "abcdefgh".split("");
const SQUARE_INDEX_MAP = Object.fromEntries(COLUMNS.map((col, colIndex) => {
  let row = 0;
  const returnArr = [];
  while (row < 8) {
    returnArr.push([`${col}${row + 1}`, (colIndex % 8) + (row * 8)]);
    row += 1;
  }
  return returnArr;
}).flat());

const LOCATION_MAP = Object.fromEntries(Object.entries(SQUARE_INDEX_MAP).map(e => e.reverse()));

const CHAR_MAP = {
  [PIECES.EMPTY]: " ",
  [PIECES.PAWN]: "p",
  [PIECES.ROOK]: "r",
  [PIECES.KNIGHT]: "n",
  [PIECES.BISHOP]: "b",
  [PIECES.QUEEN]: "q",
  [PIECES.KING]: "k",
  [PIECES.EN_PASSANT]: "e",
} as Record<number, string>;
const BOARD_COL_ROW = `    ${"abcdefgh".split("").join(" ")}`;
const BOARD_BORDER_ROW = `  +-----------------+`;

enum DIRECTION {
  DIAGONAL = "DIAGONAL",
  DIAGONAL_TOP = "DIAGONAL_TOP",
  DIAGONAL_BOTTOM = "DIAGONAL_BOTTOM",
  PLUS = "PLUS",
  KNIGHT = "KNIGHT",
  B_PAWN = "B_PAWN",
  W_PAWN = "W_PAWN",
  PAWN = "PAWN",
  ALL = "ALL",
}

const WHITE_PIECES = new Set([PIECES.PAWN, ...DEFAULT_ORDER].map((p) => p | PIECES.WHITE));
const BLACK_PIECES = new Set([PIECES.PAWN, ...DEFAULT_ORDER].map((p) => p | PIECES.BLACK));
const ALL_PIECES = new Set([...WHITE_PIECES, ...BLACK_PIECES]);

export default class Engine {
  private stateHistory: number[][];

  constructor(initialState?: number[]) {
    this.stateHistory = [initialState ?? DEFAULT_STATE];
  }

  get state() {
    return this.stateHistory[this.stateHistory.length - 1];
  }

  set state(state: number[]) {
    this.stateHistory.push(state);
  }

  getGameState(state?: number[]) {
    return (state || this.state).at(-1);
  }

  extractPiece(square: number) {
    return square & BOARD_MASKS.PIECES;
  }

  extractColour(square: number) {
    return square & BOARD_MASKS.COLOUR;
  }

  extractPieceWColourFromLocation(location: number) {
    const square = this.state[location];
    return square & BOARD_MASKS.PIECE_W_COLOUR;
  }

  indexToPosition(index: number) {
    const columns = "abcdefgh".split("");
    const row = Math.trunc(index / 8);
    const colIndex = index % 8;

    return `${columns[colIndex]}${row + 1}`;
  }

  positionToIndex(pos: string) {
    const columns = "abcdefgh".split("");
    const [col, row] = pos.split("");
    const rowInt = parseInt(row) - 1;
    const colIndex = columns.indexOf(col) + 1;

    return (rowInt * 8) + colIndex;
  }

  squareToChar(square: number) {
    const piece = this.extractPiece(square);
    const colour = this.extractColour(square);

    let outputStr = colour === PIECES.WHITE ? CHAR_MAP[piece].toUpperCase() : CHAR_MAP[piece];

    const modifier = (square & BOARD_MASKS.MODIFIERS) as TILE_MODIFIERS.TRENCH;
    if (modifier) {
      outputStr = `${MODIFIER_COLOR[modifier](outputStr)}`;
    }
    return outputStr;
  }

  draw() {
    const boardRows = new Array(8).fill(undefined).map((_, rowIndex) => {
      const start = rowIndex * 8;
      const end = start + 8;
      const rowSquares = this.state.slice(start, end);
      return rowSquares;
    });

    const boardRowStrings = boardRows.map((row, index) => {
      let str = `${index + 1} | `;
      str += row.map((square) => this.squareToChar(square)).join(" ");
      str += " |";

      return str;
    });

    boardRowStrings.reverse();
    console.log(BOARD_BORDER_ROW);
    console.log(boardRowStrings.join("\n"));
    console.log(BOARD_BORDER_ROW);
    console.log(BOARD_COL_ROW);
    console.log(`Mods: 0. ${MODIFIER_COLOR[TILE_MODIFIERS.TRENCH]("TRENCH")}, 1. ${MODIFIER_COLOR[TILE_MODIFIERS.PORTAL]("PORTAL")}, 2. ${MODIFIER_COLOR[TILE_MODIFIERS.ROYALTY_ONLY]("ROYALTY_ONLY")}, 3. ${MODIFIER_COLOR[TILE_MODIFIERS.BISHOP_ONLY]("BISHOP_ONLY")}, 4. ${MODIFIER_COLOR[TILE_MODIFIERS.ROOK_ONLY]("ROOK_ONLY")}`);

    return this.state.at(-1)?.toString(2);
  }

  getPositions() {
    return Object.fromEntries(this.state.map((square, index) => {
      if (index > 63) {
        return;
      }
      const piece = this.extractPiece(square);
      const colour = this.extractColour(square);
      const pieceChar = colour === PIECES.WHITE ? CHAR_MAP[piece].toUpperCase() : CHAR_MAP[piece];

      if (!piece || piece === PIECES.EMPTY) {
        return;
      }

      return [this.indexToPosition(index), `${pieceChar}`]
    }).filter((a) => !!a));
  }

  getPositionsForJsx() {
    return Object.fromEntries(this.state.map((square, index) => {
      if (index > 63) {
        return;
      }
      const piece = this.extractPiece(square);
      const pieceChar = CHAR_MAP[piece].toUpperCase();
      const colour = this.extractColour(square) === PIECES.WHITE ? "w" : "b";

      if (!piece || piece === PIECES.EMPTY) {
        return;
      }

      return [this.indexToPosition(index), `${colour}${pieceChar}`]
    }).filter((a) => !!a));
  }

  // I don't want to spend time implementing actual algebraic notation parsing right now (eventually will have to, when I want to support castles etc I guess)
  // current objective is to get this in a state where I can just write actual gameplay logic with a barebones ui
  move(notation: string) {
    let nextState = [...this.state];
    const [from, to] = notation.split(" ");
    const fromSquareIndex = SQUARE_INDEX_MAP[from];
    const toSquareIndex = SQUARE_INDEX_MAP[to];

    if (fromSquareIndex === toSquareIndex) {
      return false;
    }

    const isWhiteTurn = this.getGameState() === GAME_STATE.WHITE_TURN;

    const fromSquarePieceWColour = this.state[fromSquareIndex] & BOARD_MASKS.PIECE_W_COLOUR;
    const fromPieceColour = fromSquarePieceWColour & BOARD_MASKS.COLOUR;
    const fromSquarePiece = fromSquarePieceWColour & BOARD_MASKS.PIECES;
    if ((fromPieceColour === PIECES.WHITE && !isWhiteTurn) ||
      fromPieceColour === PIECES.BLACK && isWhiteTurn) {
      return false;
    }

    const [movableSquares] = this.getMovableSquares(from);
    if (!movableSquares.has(toSquareIndex)) {
      return false;
    }

    const toSquarePieceWColour = this.state[toSquareIndex] & BOARD_MASKS.PIECE_W_COLOUR;
    nextState[toSquareIndex] = toSquarePieceWColour ^ toSquarePieceWColour | fromSquarePieceWColour;
    nextState[fromSquareIndex] = fromSquarePieceWColour ^ fromSquarePieceWColour;

    if (fromSquarePiece === PIECES.PAWN) {
      if (fromPieceColour === PIECES.WHITE) {
        if (toSquarePieceWColour === (PIECES.EN_PASSANT | PIECES.BLACK)) {
          nextState[toSquareIndex - 8] ^= (PIECES.PAWN | PIECES.BLACK);
        }
      } else if (fromPieceColour === PIECES.BLACK) {
        if (toSquarePieceWColour === (PIECES.EN_PASSANT | PIECES.WHITE)) {
          nextState[toSquareIndex + 8] ^= (PIECES.PAWN | PIECES.WHITE);
        }
      }
    }

    nextState = nextState.map((square, index) => {
      if (index > 63) {
        return square;
      }
      if (this.extractPiece(square) === PIECES.EN_PASSANT) {
        return square ^ (square & BOARD_MASKS.PIECE_W_COLOUR);
      }
      return square;
    });

    if (fromSquarePiece === PIECES.PAWN) {
      if (fromPieceColour === PIECES.WHITE) {
        if (fromSquareIndex >= 8 && fromSquareIndex <= 15 && toSquareIndex === fromSquareIndex + 16) {
          nextState[toSquareIndex - 8] = PIECES.EN_PASSANT | PIECES.WHITE;
        }
      } else if (fromPieceColour === PIECES.BLACK) {
        if (fromSquareIndex >= 48 && fromSquareIndex <= 55 && toSquareIndex === fromSquareIndex - 16) {
          nextState[toSquareIndex + 8] = PIECES.EN_PASSANT | PIECES.BLACK;
        }
      }
    }
    this.state = nextState;

    const kingInDanger = this.checkKingInDanger(nextState);
    if (kingInDanger[PIECES.WHITE]) {
      if (isWhiteTurn) {
        console.log("TIS ILLEGAL");
        this.undoMove();
        return false;
      } else {
        console.log("CHECK!");
      }
    }

    if (kingInDanger[PIECES.BLACK]) {
      if (!isWhiteTurn) {
        console.log("TIS ILLEGAL");
        this.undoMove();
        return false;
      } else {
        console.log("CHECK!");
      }
    }

    this.mutateWithGameState(nextState);

    this.draw();

    this.state = nextState;

    return true;
  }

  undoMove() {
    this.stateHistory.pop();
  }

  mutateWithGameState(state: number[]) {
    // change turns
    const gameState = this.getGameState(state) === GAME_STATE.WHITE_TURN ? GAME_STATE.BLACK_TURN : GAME_STATE.WHITE_TURN;
    state.pop();
    state.push(gameState);
  }

  checkKingInDanger(_state: number[]) {
    const state = _state || this.state;
    const kingSquares = state.map((square, index) => {
      const piece = this.extractPiece(square);
      return piece === PIECES.KING ? index : undefined;
    }).filter(Boolean) as number[];

    const dangerMap: Record<number, boolean> = {};
    for (const squareIndex of kingSquares) {
      const square = state[squareIndex];
      const colour = this.extractColour(square);
      const location = LOCATION_MAP[squareIndex];
      const collisionPieces = colour === PIECES.WHITE ? WHITE_PIECES : BLACK_PIECES;
      const pawnDirection = colour === PIECES.WHITE ? DIRECTION.B_PAWN : DIRECTION.W_PAWN;
      const [, plusSquares] = this.getSquaresInDirection(location, DIRECTION.PLUS, { collisionPieces });
      const [, diagonalSquares] = this.getSquaresInDirection(location, DIRECTION.DIAGONAL, { collisionPieces });
      const [, knightSqaures] = this.getSquaresInDirection(location, DIRECTION.KNIGHT, { collisionPieces });
      const [, pawnSquares] = this.getSquaresInDirection(location, pawnDirection, { collisionPieces, depth: 1 });

      const DIAGONAL_DANGER = new Set([PIECES.BISHOP, PIECES.QUEEN, PIECES.KING]);
      const PLUS_DANGER = new Set([PIECES.ROOK, PIECES.QUEEN, PIECES.KING]);

      dangerMap[colour] = [Array.from(plusSquares).some((sIndex) => PLUS_DANGER.has(this.extractPiece(state[sIndex]))),
      Array.from(diagonalSquares).some((sIndex) => DIAGONAL_DANGER.has(this.extractPiece(state[sIndex]))),
      Array.from(knightSqaures).some((sIndex) => PIECES.KNIGHT === this.extractPiece(state[sIndex])),
      Array.from(pawnSquares).some((sIndex) => PIECES.PAWN === this.extractPiece(state[sIndex])),
      ].some((v) => v);
    }
    return dangerMap;
  }

  addModifier(location: string, modifier: string | number) {
    const targetIndex = SQUARE_INDEX_MAP[location];
    const modifierValue = MODIFIER_INDEX[modifier];
    const currentModifier = this.state[targetIndex] & BOARD_MASKS.MODIFIERS;
    this.state[targetIndex] = currentModifier ^ currentModifier | modifierValue;

    return this.draw();
  }

  getSquaresWithinBoundary(start: number, directionMod: number, boundary: Set<number>, options: { depth?: number; collisionPieces?: Set<number>; }) {
    const { depth: _depth = 8, collisionPieces } = options;
    const targetPieces = collisionPieces ? ALL_PIECES.difference(collisionPieces) : null;
    let depth = _depth;
    const squares = [];
    const targetOnlySquares = [];
    let currentLocation = start + directionMod;
    while (currentLocation >= 0 && currentLocation < 64 && depth--) {
      const prevLocation = currentLocation - directionMod;
      if (boundary.has(currentLocation) && boundary.has(prevLocation)) {
        break;
      }

      const pieceWColour = this.extractPieceWColourFromLocation(currentLocation);
      if (!collisionPieces?.has(pieceWColour)) {
        squares.push(currentLocation);

        if (targetPieces?.has(pieceWColour)) {
          targetOnlySquares.push(currentLocation);
          break;
        }

        currentLocation = currentLocation + directionMod;
      } else {
        break;
      }
    }

    return [squares, targetOnlySquares];
  }

  getSquaresInDirection(location: string, direction: DIRECTION, options: { depth?: number; collisionPieces?: Set<number>; }) {
    const { collisionPieces } = options;
    const squareIndex = SQUARE_INDEX_MAP[location];
    const leftWall = new Set([0, 8, 16, 24, 32, 40, 48, 56]);
    const rightWall = new Set([7, 15, 23, 31, 39, 47, 55, 63]);
    const topWall = new Set([56, 57, 58, 59, 60, 61, 62, 63]);
    const bottomWall = new Set([0, 1, 2, 3, 4, 5, 6, 7,]);
    const horizontalBoundary = new Set([...bottomWall, ...topWall]);
    const verticalBoundary = new Set([...leftWall, ...rightWall]);
    const squareBoundary = new Set([...horizontalBoundary, ...verticalBoundary]);

    const squares: Array<number[] | number> = [];
    const targetOnlySquares: Array<number[] | number> = [];
    if (direction === DIRECTION.PLUS || direction === DIRECTION.ALL) {
      const left = this.getSquaresWithinBoundary(squareIndex, -1, verticalBoundary, options);
      const right = this.getSquaresWithinBoundary(squareIndex, 1, verticalBoundary, options);
      const up = this.getSquaresWithinBoundary(squareIndex, +8, horizontalBoundary, options);
      const down = this.getSquaresWithinBoundary(squareIndex, -8, horizontalBoundary, options);
      squares.push(left[0], right[0], up[0], down[0]);
      targetOnlySquares.push(left[1], right[1], up[1], down[1]);
    }

    if (direction === DIRECTION.DIAGONAL || direction === DIRECTION.ALL) {
      const topLeft = this.getSquaresWithinBoundary(squareIndex, 7, squareBoundary, options);
      const topRight = this.getSquaresWithinBoundary(squareIndex, 9, squareBoundary, options);
      const bottomLeft = this.getSquaresWithinBoundary(squareIndex, -9, squareBoundary, options);
      const bottomRight = this.getSquaresWithinBoundary(squareIndex, -7, squareBoundary, options);
      squares.push(topLeft[0], topRight[0], bottomLeft[0], bottomRight[0]);
      targetOnlySquares.push(topLeft[1], topRight[1], bottomLeft[1], bottomRight[1]);
    }

    if (direction === DIRECTION.DIAGONAL_TOP) {
      const topLeft = this.getSquaresWithinBoundary(squareIndex, 7, squareBoundary, options);
      const topRight = this.getSquaresWithinBoundary(squareIndex, 9, squareBoundary, options);
      squares.push(topLeft[0], topRight[0]);
      targetOnlySquares.push(topLeft[1], topRight[1]);
    }

    if (direction === DIRECTION.DIAGONAL_BOTTOM) {
      const bottomLeft = this.getSquaresWithinBoundary(squareIndex, -9, squareBoundary, options);
      const bottomRight = this.getSquaresWithinBoundary(squareIndex, -7, squareBoundary, options);
      squares.push(bottomLeft[0], bottomRight[0]);
      targetOnlySquares.push(bottomLeft[1], bottomRight[1]);
    }

    if (direction === DIRECTION.KNIGHT) {
      const targetPieces = collisionPieces ? ALL_PIECES.difference(collisionPieces) : null;
      const plusDirWithinBoundary = this.getSquaresInDirection(location, DIRECTION.PLUS, { depth: 2 });
      const ekBeModsVertical = [16, -16];
      const ekBeModsHorizontal = [2, -2];
      ekBeModsVertical.forEach((mod) => {
        const beSquare = squareIndex + mod;
        if (plusDirWithinBoundary[0].has(beSquare)) {
          if (!leftWall.has(beSquare)) {
            const finalIndex = beSquare - 1;
            const pieceWColour = this.extractPieceWColourFromLocation(finalIndex);
            if (!collisionPieces?.has(pieceWColour)) {
              squares.push(finalIndex);

              if (targetPieces?.has(pieceWColour)) {
                targetOnlySquares.push(finalIndex);
              }
            }
          }
          if (!rightWall.has(beSquare)) {
            const finalIndex = beSquare + 1;
            const pieceWColour = this.extractPieceWColourFromLocation(finalIndex);
            if (!collisionPieces?.has(pieceWColour)) {
              squares.push(finalIndex);

              if (targetPieces?.has(pieceWColour)) {
                targetOnlySquares.push(finalIndex);
              }
            }
          }
        }
      });

      ekBeModsHorizontal.forEach((mod) => {
        const beSquare = squareIndex + mod;
        if (plusDirWithinBoundary[0].has(beSquare)) {
          if (!bottomWall.has(beSquare)) {
            const finalIndex = beSquare - 8;
            const pieceWColour = this.extractPieceWColourFromLocation(finalIndex);
            if (!collisionPieces?.has(pieceWColour)) {
              squares.push(finalIndex);

              if (targetPieces?.has(pieceWColour)) {
                targetOnlySquares.push(finalIndex);
              }
            }
          }
          if (!topWall.has(beSquare)) {
            const finalIndex = beSquare + 8;
            const pieceWColour = this.extractPieceWColourFromLocation(finalIndex);
            if (!collisionPieces?.has(pieceWColour)) {
              squares.push(finalIndex);

              if (targetPieces?.has(pieceWColour)) {
                targetOnlySquares.push(finalIndex);
              }
            }
          }
        }
      });
    }

    if ([DIRECTION.PAWN, DIRECTION.B_PAWN, DIRECTION.W_PAWN].includes(direction)) {
      const locationSquare = this.state[squareIndex];
      const colour = this.extractColour(locationSquare);

      // not sure if I want to tag "unmoved" pieces,
      // I'll just allow the pawn to move two squares if they're in the 2nd closest row to the players
      if (direction === DIRECTION.W_PAWN || colour === PIECES.WHITE) {
        const captureSquares = this.getSquaresInDirection(location, DIRECTION.DIAGONAL_TOP, { depth: 1, collisionPieces: new Set([...WHITE_PIECES, PIECES.EMPTY]) });
        const pieceWColour = this.extractPieceWColourFromLocation(squareIndex + 8);
        if (!ALL_PIECES.has(pieceWColour)) {
          squares.push(squareIndex + 8);

          if (squareIndex >= 8 && squareIndex <= 15) {
            const pieceWColour = this.extractPieceWColourFromLocation(squareIndex + 16);
            if (!ALL_PIECES.has(pieceWColour)) {
              squares.push(squareIndex + 16);
            }
          }
        }
        captureSquares[0].forEach((s) => squares.push(s));
        captureSquares[1].forEach((s) => targetOnlySquares.push(s));
      } else if (direction === DIRECTION.B_PAWN || colour === PIECES.BLACK) {
        const captureSquares = this.getSquaresInDirection(location, DIRECTION.DIAGONAL_BOTTOM, { depth: 1, collisionPieces: new Set([...BLACK_PIECES, PIECES.EMPTY]) });
        const pieceWColour = this.extractPieceWColourFromLocation(squareIndex - 8);
        if (!ALL_PIECES.has(pieceWColour)) {
          squares.push(squareIndex - 8);

          if (squareIndex >= 48 && squareIndex <= 55) {
            const pieceWColour = this.extractPieceWColourFromLocation(squareIndex - 16);
            if (!ALL_PIECES.has(pieceWColour)) {
              squares.push(squareIndex - 16);
            }
          }
        }
        captureSquares[0].forEach((s) => squares.push(s));
        captureSquares[1].forEach((s) => targetOnlySquares.push(s));
      }
    }

    return [new Set(squares.flat()), new Set(targetOnlySquares.flat())];
  }

  getMovableSquares(location: string) {
    const squareIndex = SQUARE_INDEX_MAP[location];
    const locationSquare = this.state[squareIndex];

    const currentPiece = this.extractPiece(locationSquare);
    const colour = this.extractColour(locationSquare);
    const collisionPieces = colour === PIECES.WHITE ? WHITE_PIECES : BLACK_PIECES;

    if (currentPiece === PIECES.KNIGHT) {
      return this.getSquaresInDirection(location, DIRECTION.KNIGHT, { collisionPieces });
    }

    if (currentPiece === PIECES.QUEEN) {
      return this.getSquaresInDirection(location, DIRECTION.ALL, { collisionPieces });
    }

    if (currentPiece === PIECES.KING) {
      return this.getSquaresInDirection(location, DIRECTION.ALL, { depth: 1, collisionPieces });
    }

    if (currentPiece === PIECES.BISHOP) {
      return this.getSquaresInDirection(location, DIRECTION.DIAGONAL, { collisionPieces });
    }

    if (currentPiece === PIECES.ROOK) {
      return this.getSquaresInDirection(location, DIRECTION.PLUS, { collisionPieces });
    }

    if (currentPiece === PIECES.PAWN) {
      return this.getSquaresInDirection(location, DIRECTION.PAWN, { collisionPieces });
    }

    return [new Set<number>(), new Set<number>()];
  }
}
