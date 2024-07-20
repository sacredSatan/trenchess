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
  PAWN   = 0b00_001,
  ROOK   = 0b00_010,
  BISHOP = 0b00_011,
  KNIGHT = 0b00_100,
  QUEEN  = 0b00_101,
  KING   = 0b00_110,
  WHITE  = 0b01_000,
  BLACK  = 0b10_000,
  EMPTY  = 0,
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
  ROYALTY_ONLY  = 0b0011_00000,
  ROOK_ONLY     = 0b0100_00000,
  BISHOP_ONLY   = 0b0101_00000,
  
  // treating valid en passant as a modifier for now
  EN_PASSANT    = 0b1_00000000,
}

enum MASKS {
  PIECES = 0b111,
  COLOUR = 0b11_000,
  PIECE_W_COLOUR = 0b11111,
  MODIFIERS = 0b1111_00000,
  TURN = 0b1,
  CASTLE = 0b1111_0,
}

// currently thinking of representing the game state in a single number for both white and black
// what I think I need to keep track of
// castles: (only keep track of whether a king side / queen side castle is allowed)
enum GAME_STATE {
  WHITE_TURN = 0b0,
  BLACK_TURN = 0b1,
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
  while(row < 8) {
    returnArr.push([ `${col}${row + 1}`, (colIndex % 8) + (row * 8) ]);
    row += 1;
  }
  return returnArr;
}).flat());

const CHAR_MAP = {
  [PIECES.EMPTY]: " ",
  [PIECES.PAWN]: "p",
  [PIECES.ROOK]: "r",
  [PIECES.KNIGHT]: "n",
  [PIECES.BISHOP]: "b",
  [PIECES.QUEEN]: "q",
  [PIECES.KING]: "k",
} as Record<number, string>;
const BOARD_COL_ROW = `    ${"abcdefgh".split("").join(" ")}`;
const BOARD_BORDER_ROW = `  +-----------------+`;


export default class Engine {
  private state: number[];

  constructor(initialState?: number[]) {
    this.state = initialState ?? DEFAULT_STATE;
  }
  
  extractPiece(square: number) {
    return square & MASKS.PIECES;
  }
  
  extractColour(square: number) {
    return square & MASKS.COLOUR;
  }
  
  indexToPosition(index: number) {
    const columns = "abcdefgh".split("");
    const row = Math.trunc(index / 8);
    const colIndex = index % 8;

    return `${columns[colIndex]}${row + 1}`;
  }
  
  positionToIndex(pos: string) {
    const columns = "abcdefgh".split("");
    const [ col, row ] = pos.split("");
    const rowInt = parseInt(row) - 1;
    const colIndex = columns.indexOf(col) + 1;
    
    return (rowInt * 8) + colIndex;
  }
  
  squareToChar(square: number) {
    const piece = this.extractPiece(square);
    const colour = this.extractColour(square);
    
    let outputStr = colour === PIECES.WHITE ? CHAR_MAP[piece].toUpperCase() : CHAR_MAP[piece];
    
    const modifier = (square & MASKS.MODIFIERS) as TILE_MODIFIERS.TRENCH;
    if(modifier) {
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
      if(index > 63) {
        return;
      }
      const piece = this.extractPiece(square);
      const colour = this.extractColour(square);
      const pieceChar = colour === PIECES.WHITE ? CHAR_MAP[piece].toUpperCase() : CHAR_MAP[piece];
      
      if(!piece || piece === PIECES.EMPTY) {
        return;
      }
      
      return [ this.indexToPosition(index), `${pieceChar}` ]
    }).filter((a) => !!a));
  }
  
  getPositionsForJsx() {
    return Object.fromEntries(this.state.map((square, index) => {
      if(index > 63) {
        return;
      }
      const piece = this.extractPiece(square);
      const pieceChar = CHAR_MAP[piece].toUpperCase();
      const colour = this.extractColour(square) === PIECES.WHITE ? "w" : "b";
      
      if(!piece || piece === PIECES.EMPTY) {
        return;
      }
      
      return [ this.indexToPosition(index), `${colour}${pieceChar}` ]
    }).filter((a) => !!a));
  }
  
  // I don't want to spend time implementing actual algebraic notation parsing right now (eventually will have to, when I want to support castles etc I guess)
  // current objective is to get this in a state where I can just write actual gameplay logic with a barebones ui
  move(notation: string) {
    const [ from, to ] = notation.split(" ");
    const fromSquareIndex = SQUARE_INDEX_MAP[from];
    const toSquareIndex = SQUARE_INDEX_MAP[to];
        
    const fromSquarePiece = this.state[fromSquareIndex] & MASKS.PIECE_W_COLOUR;
    this.state[toSquareIndex] = this.state[toSquareIndex] | MASKS.PIECE_W_COLOUR & fromSquarePiece;
    this.state[fromSquareIndex] = fromSquarePiece ^ fromSquarePiece;
    
    return this.draw();
  }
  
  addModifier(location: string, modifier: string | number) {
    const targetIndex = SQUARE_INDEX_MAP[location];
    const modifierValue = MODIFIER_INDEX[modifier];
    const currentModifier = this.state[targetIndex] & MASKS.MODIFIERS;
    this.state[targetIndex] = currentModifier ^ currentModifier | modifierValue;
    
    return this.draw();
  }
}
