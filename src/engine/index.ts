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
  // ROYALTY_ONLY = 0b0011_00000,
  // ROOK_ONLY = 0b0100_00000,
  // BISHOP_ONLY = 0b0101_00000,
  REVERSE_PAWN = 0b0111_00000,

  // I don't think clear and shove need to be defined here since they don't "stay" on the board
  // but it's fine for now
  CLEAR_MODIFIER = 0b0110_00000,
  SHOVE_PAWN = 0b0101_00000,

  // treating valid en passant as a modifier for now
  // didn't do it this way after all
  // EN_PASSANT    = 0b1_00000000,
}

const STICKY_MODIFIERS = new Set([
  TILE_MODIFIERS.TRENCH,
  TILE_MODIFIERS.PORTAL,
  TILE_MODIFIERS.REVERSE_PAWN,
  TILE_MODIFIERS.CLEAR_MODIFIER,

  // the idea initially was to make this a non-sticky modifier and handle it differently but for now it's fine
  // same with clear modifier
  TILE_MODIFIERS.SHOVE_PAWN,
]);


enum CARDS {
  CLEAR_MODIFIER = 0b0001,
  TRENCH = 0b0010,
  PORTAL = 0b0011,
  REVERSE_PAWN = 0b0100,
  SHOVE_PAWN = 0b0101,
  MASK = 0b1111,
}

const CARD_TO_TILE_MODIFIERS_MAP = {
  [CARDS.TRENCH]: TILE_MODIFIERS.TRENCH,
  [CARDS.PORTAL]: TILE_MODIFIERS.PORTAL,
  [CARDS.REVERSE_PAWN]: TILE_MODIFIERS.REVERSE_PAWN,
  [CARDS.SHOVE_PAWN]: TILE_MODIFIERS.SHOVE_PAWN,
  [CARDS.CLEAR_MODIFIER]: TILE_MODIFIERS.CLEAR_MODIFIER,
} as Record<CARDS, TILE_MODIFIERS>;

const TILE_MODIFIERS_TO_CARD_MAP = Object.fromEntries(Object.entries(CARD_TO_TILE_MODIFIERS_MAP).map(e => e.reverse()));

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
}

enum GAME_STATE_MASKS {
  TURN = 0b1,
  BQ_CASTLE = 0b0001_0,
  BK_CASTLE = 0b0010_0,
  WQ_CASTLE = 0b0100_0,
  WK_CASTLE = 0b1000_0,
  W_ILLEGAL = 0b01_0000_0,
  B_ILLEGAL = 0b10_0000_0,
  PROMOTION = 0b1_00_0000_0,
}

const MODIFIER_INDEX = {
  "-1": TILE_MODIFIERS.CLEAR_MODIFIER,
  "0": TILE_MODIFIERS.TRENCH,
  "1": TILE_MODIFIERS.PORTAL,
  "2": TILE_MODIFIERS.REVERSE_PAWN,
  "3": TILE_MODIFIERS.SHOVE_PAWN,
} as Record<string, number>;


// wassup "⁰","¹","²","³","⁴","⁵","⁶","⁷","⁸","⁹"
const MODIFIER_CHAR = {
  [TILE_MODIFIERS.CLEAR_MODIFIER]: "⁰",
  [TILE_MODIFIERS.TRENCH]: "¹",
  [TILE_MODIFIERS.PORTAL]: "²",
  [TILE_MODIFIERS.REVERSE_PAWN]: "³",
  [TILE_MODIFIERS.SHOVE_PAWN]: "⁴",
} as Record<TILE_MODIFIERS, string>;

const CHAR_TO_MODIFIER_MAP = Object.fromEntries(Object.entries(MODIFIER_CHAR).map(e => e.reverse()))

const DEFAULT_ORDER = [
  PIECES.ROOK, PIECES.KNIGHT, PIECES.BISHOP, PIECES.QUEEN, PIECES.KING, PIECES.BISHOP, PIECES.KNIGHT, PIECES.ROOK
];


// white's turn
const DEFAULT_GAME_STATE = GAME_STATE.WHITE_TURN |  GAME_STATE_MASKS.WQ_CASTLE | GAME_STATE_MASKS.WK_CASTLE | GAME_STATE_MASKS.BQ_CASTLE | GAME_STATE_MASKS.BK_CASTLE | GAME_STATE_MASKS.W_ILLEGAL | GAME_STATE_MASKS.B_ILLEGAL;
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

const STATE_FOR_CASTLE_TEST = [
  // white's pieces
  ...DEFAULT_ORDER.map((piece) => (piece | PIECES.WHITE)),
  ...new Array(8).fill(PIECES.EMPTY),
  // 4 empty rows
  ...new Array(32).fill(PIECES.EMPTY),
  // black's pieces
  ...new Array(8).fill(PIECES.EMPTY),
  ...DEFAULT_ORDER.map((piece) => piece !== PIECES.ROOK && piece !== PIECES.KING ? PIECES.EMPTY : (piece | PIECES.BLACK)),

  // game state
  DEFAULT_GAME_STATE,
];

const STATE_FOR_PROMOTION_TEST = [
  // white's pieces
  ...new Array(8).fill(PIECES.EMPTY),
  ...new Array(8).fill(PIECES.PAWN | PIECES.BLACK),
  // 4 empty rows
  ...new Array(32).fill(PIECES.EMPTY),
  // black's pieces
  ...new Array(8).fill(PIECES.PAWN | PIECES.WHITE),
  ...new Array(8).fill(PIECES.EMPTY),

  // game state
  DEFAULT_GAME_STATE,
];

const STATE_FOR_STALEMATE_TEST = [
    PIECES.KING | PIECES.BLACK, ...new Array(7).fill(PIECES.EMPTY),
    ...new Array(16).fill(PIECES.EMPTY),
    PIECES.EMPTY, PIECES.EMPTY, PIECES.QUEEN | PIECES.WHITE | TILE_MODIFIERS.PORTAL, ...new Array(5).fill(PIECES.EMPTY),
    ...new Array(32).fill(PIECES.EMPTY),
  
    // game state
    DEFAULT_GAME_STATE,
];

const STATE_FOR_CHECKMATE_BUG =  [10,12,11,13,14,11,12,10,9,9,9,9,0,9,9,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,17,17,0,0,0,0,0,0,0,23,0,17,17,17,17,17,0,0,17,18,20,19,21,22,19,20,18,126];
// const STATE_FOR_REVERSE_PAWN = [10,12,11,13,14,11,12,10,9,9,9,9,0,0,9,9,0,0,0,17,0,0,0,0,0,0,0,0,233,0,0,0,0,0,17,0,0,9,0,0,0,0,0,0,0,0,0,0,17,17,0,0,17,17,17,17,18,20,19,21,22,19,20,18,126,143908,3355204];

const COLUMNS = "abcdefgh".split("");
const SQUARE_INDEX_MAP = Object.fromEntries(COLUMNS.map((col, colIndex) => {
  let row = 0;
  const returnArr: [string, number][] = [];
  while (row < 8) {
    returnArr.push([`${col}${row + 1}`, (colIndex % 8) + (row * 8)]);
    row += 1;
  }
  return returnArr;
}).flat()) as Record<string, number>;

const LOCATION_MAP = Object.fromEntries(Object.entries(SQUARE_INDEX_MAP).map(e => e.reverse())) as Record<number, string>;

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
const CHAR_TO_PIECES_MAP = Object.fromEntries(Object.entries(CHAR_MAP).map(e => e.reverse())) as Record<string, number>;
const BOARD_COL_ROW = `    ${"abcdefgh".split("").join("  ")}`;
const BOARD_BORDER_ROW = `  +-------------------------+`;

enum DIRECTION {
  DIAGONAL = "DIAGONAL",
  DIAGONAL_TOP = "DIAGONAL_TOP",
  DIAGONAL_BOTTOM = "DIAGONAL_BOTTOM",
  PLUS = "PLUS",
  KNIGHT = "KNIGHT",
  B_PAWN = "B_PAWN",
  W_PAWN = "W_PAWN",
  W_PAWN_REVERSE = "W_PAWN_REVERSE",
  B_PAWN_REVERSE = "B_PAWN_REVERSE",
  PAWN = "PAWN",
  ALL = "ALL",
}

const WHITE_PIECES = new Set([PIECES.PAWN, ...DEFAULT_ORDER].map((p) => p | PIECES.WHITE));
const BLACK_PIECES = new Set([PIECES.PAWN, ...DEFAULT_ORDER].map((p) => p | PIECES.BLACK));
const ALL_PIECES = new Set([...WHITE_PIECES, ...BLACK_PIECES]);

enum CastleStateOptions {
  "wkc" = "wkc",
  "wqc" = "wqc",
  "bkc" = "bkc",
  "bqc" = "bqc",
}

export enum MOVE_RETURN_VALUES {
  INVALID,
  ILLEGAL,
  STALEMATE,
  CHECKMATE,
  REPEATDRAW,
  MOVE,
}

export const MOVE_RETURN_VALUES_MAP = {
  [MOVE_RETURN_VALUES.INVALID]: "INVALID",
  [MOVE_RETURN_VALUES.ILLEGAL]: "ILLEGAL",
  [MOVE_RETURN_VALUES.STALEMATE]: "STALEMATE",
  [MOVE_RETURN_VALUES.CHECKMATE]: "CHECKMATE",
  [MOVE_RETURN_VALUES.REPEATDRAW]: "REPEATDRAW",
  [MOVE_RETURN_VALUES.MOVE]: "MOVE",
}

const STATE_FOR_ILLEGAL_MATE_TEST = [10,12,11,13,14,11,12,10,9,9,9,9,9,0,9,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,0,0,17,17,17,17,0,0,17,17,18,20,19,21,22,19,20,18,127];
const STATE_FOR_PORTAL_TEST =  [22,0,0,0,0,0,0,14,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,77,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,127];
const STATE_FOR_TRENCH_TEST = [ 14, 0, 0, 0, 0, 0, 0, 22, 49, 49, 0, 0, 0, 0, 49, 17, 0, 0, 0, 0, 0, 0, 0, 17, 0, 0, 0, 0, 13, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 127];
const STATE_FOR_CASTLE_BUG = [10,12,0,13,14,0,0,10,9,0,9,9,9,9,0,9,0,9,0,0,0,12,9,0,0,20,0,0,0,0,20,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,17,19,17,17,17,17,19,17,18,0,0,21,22,0,0,18,127];

export const ALL_CARDS = [ CARDS.CLEAR_MODIFIER, CARDS.PORTAL, CARDS.TRENCH, CARDS.REVERSE_PAWN, CARDS.SHOVE_PAWN ];
export const MAX_CARDS_IN_HAND = ALL_CARDS.length;
// const ALL_CARDS = [ CARDS.REVERSE_PAWN, CARDS.REVERSE_PAWN, CARDS.REVERSE_PAWN, CARDS.REVERSE_PAWN ];

type SkipModifiersOptions = {
  skipAll?: boolean;
  skipPortal?: boolean;
  skipTrench?: boolean;
}

type InitialState = {
  isWhite: boolean;
  whiteCards: number;
  blackCards: number;
  whiteCardDrawCounter: number;
  blackCardDrawCounter: number;
};

const GAME_STATE_INDEX = 64;
const WHITE_CARDS_INDEX = 65;
const BLACK_CARDS_INDEX = 66;
const WHITE_CARD_DRAW_COUNTER_INDEX = 67;
const BLACK_CARD_DRAW_COUNTER_INDEX = 68;

const CARD_DRAW_COUNTER_INITIAL_VALUE = 4;

const STATE_FOR_PORTAL_BUG = [10,12,11,0,14,11,12,10,9,9,9,233,0,0,9,9,0,0,0,0,0,64,0,0,0,0,0,0,9,0,0,0,0,0,0,73,241,49,0,13,0,0,0,17,0,0,17,0,17,17,17,0,0,0,0,17,18,20,19,21,22,19,20,18,126,819,17473];

export default class Engine {
  private stateHistory: number[][];
  private positionCountMap: Map<string, number>;
  private lastMoveState: string;
  private moveHistory: { type: string; value: string | string[] | number[] }[];

  constructor(initialState?: number[]) {
    this.stateHistory = [initialState ?? DEFAULT_STATE ?? STATE_FOR_PORTAL_BUG ?? STATE_FOR_CASTLE_BUG ?? STATE_FOR_TRENCH_TEST ?? STATE_FOR_PORTAL_TEST ?? STATE_FOR_CHECKMATE_BUG ?? STATE_FOR_ILLEGAL_MATE_TEST ?? STATE_FOR_STALEMATE_TEST ?? STATE_FOR_PROMOTION_TEST ?? STATE_FOR_CASTLE_TEST ?? STATE_FOR_PROMOTION_TEST];
    this.positionCountMap = new Map();
    this.lastMoveState = MOVE_RETURN_VALUES_MAP[MOVE_RETURN_VALUES.MOVE];
    this.moveHistory = [];
  }

  get state() {
    return this.stateHistory[this.stateHistory.length - 1];
  }

  set state(state: number[]) {
    this.stateHistory.push(state);
  }

  replaceState(state: number[]) {
    this.stateHistory[this.stateHistory.length - 1] = state;
  }

  buildCardNumber(cards: number[]) {
    let cardNumber = 0;
    cards.forEach(card => {
      cardNumber <<= 4;
      cardNumber |= card;
    });

    return cardNumber;
  }

  initializeGameWithFullState(fullState: number[]) {
    this.stateHistory = [ fullState ];
    this.moveHistory = [ { type: "initialState", value: fullState } ];
  }

  initializeGame(initialState?: InitialState) {
    const state = initialState || {
      isWhite: Math.random() < Math.random(),
      whiteCards: 0,
      blackCards: 0,
      whiteCardDrawCounter: CARD_DRAW_COUNTER_INITIAL_VALUE,
      blackCardDrawCounter: CARD_DRAW_COUNTER_INITIAL_VALUE,
    };

    // it'll be an issue if initial state is actually one where all cards have been spent
    if(!initialState || (initialState && !initialState.whiteCards && !initialState.blackCards)) {
      // since you can draw cards now, initially just both players 4 cards
      // then every 4 moves you can draw 2 cards, max capped at 6
      // state.whiteCards = this.buildCardNumber(new Array(6).fill(undefined).map(() => availableCards[Math.floor(Math.random() * availableCards.length)]));
      // state.blackCards = this.buildCardNumber(new Array(6).fill(undefined).map(() => availableCards[Math.floor(Math.random() * availableCards.length)]));
      state.whiteCards = this.buildCardNumber(ALL_CARDS);
      state.blackCards = this.buildCardNumber(ALL_CARDS);
    }

    this.stateHistory = [ [ ...DEFAULT_STATE, state.whiteCards, state.blackCards, state.whiteCardDrawCounter, state.blackCardDrawCounter ] ];
    this.moveHistory.push({
      type: "initialState",
      value: this.stateHistory[0],
    });
    return state;
  }

  resetState(setDefault?: boolean) {
    const emptyState = new Array(64).fill(0);
    emptyState.push(DEFAULT_GAME_STATE);

    this.stateHistory = [ setDefault ? DEFAULT_STATE : emptyState ];
    this.lastMoveState = "";
  }

  getGameState(state?: number[]) {
    console.log(this.state, state, GAME_STATE_INDEX, "GET GAME STATE ====== debugggg")
    const gameStateNumber = (state || this.state)?.at(GAME_STATE_INDEX) ?? 0;
    
    return {
      turn: gameStateNumber & GAME_STATE_MASKS.TURN,
      // promotionWaiting: (gameStateNumber & GAME_STATE_MASKS.PROMOTION) === GAME_STATE_MASKS.PROMOTION,
      whiteIllegalLeft: (gameStateNumber & GAME_STATE_MASKS.W_ILLEGAL) === GAME_STATE_MASKS.W_ILLEGAL,
      blackIllegalLeft: (gameStateNumber & GAME_STATE_MASKS.B_ILLEGAL) === GAME_STATE_MASKS.B_ILLEGAL,
      [CastleStateOptions.wkc]: (gameStateNumber & GAME_STATE_MASKS.WK_CASTLE) === GAME_STATE_MASKS.WK_CASTLE,
      [CastleStateOptions.wqc]: (gameStateNumber & GAME_STATE_MASKS.WQ_CASTLE) === GAME_STATE_MASKS.WQ_CASTLE,
      [CastleStateOptions.bkc]: (gameStateNumber & GAME_STATE_MASKS.BK_CASTLE) === GAME_STATE_MASKS.BK_CASTLE,
      [CastleStateOptions.bqc]: (gameStateNumber & GAME_STATE_MASKS.BQ_CASTLE) === GAME_STATE_MASKS.BQ_CASTLE,
    }
  }

  getCards(state?: number[]) {
    const whiteCardsNumber = (state || this.state)?.at(WHITE_CARDS_INDEX) ?? 0;
    const blackCardsNumber = (state || this.state)?.at(BLACK_CARDS_INDEX) ?? 0;

    const [ whiteCards, blackCards ] = [ whiteCardsNumber, blackCardsNumber ].map((cardsNumber) => {
      const cards = [];
      while(cardsNumber & CARDS.MASK) {
        const card = (cardsNumber & CARDS.MASK) as CARDS;
        cardsNumber >>= 4;
        console.log(cardsNumber, card, MODIFIER_CHAR[CARD_TO_TILE_MODIFIERS_MAP[card]], CARD_TO_TILE_MODIFIERS_MAP[card], "====== carddds");
        cards.push(MODIFIER_CHAR[CARD_TO_TILE_MODIFIERS_MAP[card]]);
      }
      return cards;
    });

    console.log({ whiteCards, blackCards });

    return {
      whiteCards,
      blackCards,
      whiteCardDrawCounter: (state || this.state)?.at(WHITE_CARD_DRAW_COUNTER_INDEX) ?? CARD_DRAW_COUNTER_INITIAL_VALUE,
      blackCardDrawCounter: (state || this.state)?.at(BLACK_CARD_DRAW_COUNTER_INDEX) ?? CARD_DRAW_COUNTER_INITIAL_VALUE,
    }
  }

  getRandomCards(count = 2) {
    return new Array(count).fill(undefined).map(() => MODIFIER_CHAR[CARD_TO_TILE_MODIFIERS_MAP[ALL_CARDS[Math.floor(Math.random() * ALL_CARDS.length)]]]);
  }

  applyCardSelection(selectedCards: string[], _state?: number[]) {
    const state = _state || this.state;
    const nextState = [...state];
    const gameState = this.getGameState(state);
    const cardIndex = gameState.turn === GAME_STATE.WHITE_TURN ? WHITE_CARDS_INDEX : BLACK_CARDS_INDEX;
    const cardDrawCountIndex = gameState.turn === GAME_STATE.WHITE_TURN ? WHITE_CARD_DRAW_COUNTER_INDEX : BLACK_CARD_DRAW_COUNTER_INDEX;
    const cardsNumber = this.buildCardNumber(selectedCards.map((card) => TILE_MODIFIERS_TO_CARD_MAP[CHAR_TO_MODIFIER_MAP[card]]));
    nextState[cardIndex] = cardsNumber;
    nextState[cardDrawCountIndex] = CARD_DRAW_COUNTER_INITIAL_VALUE;
    // replace state because I don't want this to count towards repeatdraw
    this.replaceState(nextState);
    this.moveHistory.push({
      type: "cardSelection",
      value: selectedCards,
    });
  }
  
  getCurrentTurn(state?: number[]) {
    const gameStateNumber = (state || this.state).at(GAME_STATE_INDEX) ?? 0;
    const turn = gameStateNumber & GAME_STATE_MASKS.TURN;
    if(turn === GAME_STATE.WHITE_TURN) {
      return "white";
    }
    return "black";
  }

  extractPiece(square: number) {
    return square & BOARD_MASKS.PIECES;
  }

  extractColour(square: number) {
    return square & BOARD_MASKS.COLOUR;
  }

  extractModifierFromSquareIndex(squareIndex: number, _state?: number[]) {
    const state = _state || this.state;
    const square = state[squareIndex];
    return square & BOARD_MASKS.MODIFIERS;
  }

  extractPieceWColourFromSquareIndex(squareIndex: number, _state?: number[]) {
    const state = _state || this.state;
    const square = state[squareIndex];
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

    const outputStr = colour === PIECES.WHITE ? CHAR_MAP[piece].toUpperCase() : CHAR_MAP[piece];

    // firefox can't do ansi colors, only styled console messages with %c, I don't want to spend time on that
    const modifier = (square & BOARD_MASKS.MODIFIERS) as TILE_MODIFIERS;
    const modifierChar = MODIFIER_CHAR[modifier] ?? " ";

    return outputStr + modifierChar;
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
    // console.log(`Mods: 0. ${MODIFIER_COLOR[TILE_MODIFIERS.TRENCH]("TRENCH")}, 1. ${MODIFIER_COLOR[TILE_MODIFIERS.PORTAL]("PORTAL")}, 2. ${MODIFIER_COLOR[TILE_MODIFIERS.ROYALTY_ONLY]("ROYALTY_ONLY")}, 3. ${MODIFIER_COLOR[TILE_MODIFIERS.BISHOP_ONLY]("BISHOP_ONLY")}, 4. ${MODIFIER_COLOR[TILE_MODIFIERS.ROOK_ONLY]("ROOK_ONLY")}`);

    console.log(this.getGameState());
    return this.state.at(GAME_STATE_INDEX)?.toString(2);
  }

  getPositions() {
    const turn = this.getGameState().turn;
    const cards = this.getCards();
    console.log("getpositions cards", cards);
    return [ Object.fromEntries(this.state.map((square, index) => {
      if (index > 63) {
        return;
      }

      const squareChar = this.squareToChar(square)
      if(squareChar === "  ") {
        return;
      }

      const [piece, modifier] = squareChar.split("");

      return [this.indexToPosition(index), [ piece === " " ? undefined : piece, modifier === " " ? undefined : modifier ]];
    }).filter((a) => !!a)), { lastMoveState: this.lastMoveState, currentTurn: turn === 0 ? "WHITE" : "BLACK" }, cards, this.moveHistory ]
  }

  move(notation: string, options?: { skipCommit: boolean; state?: number[]; skipCheckMate?: boolean; skipStaleMate?: boolean; }): MOVE_RETURN_VALUES {
    const lastMoveReturnValue = this._move(notation, options);
    if(!options?.skipCommit) {
      this.lastMoveState = MOVE_RETURN_VALUES_MAP[lastMoveReturnValue];
      // only record valid moves
      if(lastMoveReturnValue > 1) {
        this.moveHistory.push({
          type: "move",
          value: notation,
        });
      }
    }
    this.draw();
    return lastMoveReturnValue;
  }

  _dangerouslyReplaceSquareValue(location: string, pieceName: string, _state?: number[]) {
    const state = _state || this.state;
    const nextState = [...state];
    const squareIndex = SQUARE_INDEX_MAP[location];
    const isWhite = pieceName !== pieceName.toLowerCase();
    const pieceValue = CHAR_TO_PIECES_MAP[pieceName.toLowerCase()];
    const color = isWhite ? PIECES.WHITE : PIECES.BLACK;
    const modifier = this.extractModifierFromSquareIndex(squareIndex, state);

    nextState[squareIndex] = pieceValue | color | modifier;
    this.state = nextState;
    console.log(this.state, "==== last state");
  }
  
  // I don't want to spend time implementing actual algebraic notation parsing right now (eventually will have to, when I want to support castles etc I guess)
  // current objective is to get this in a state where I can just write actual gameplay logic with a barebones ui
  _move(notation: string, options?: { skipCommit: boolean; state?: number[]; skipCheckMate?: boolean; skipStaleMate?: boolean; }): MOVE_RETURN_VALUES {
    debugger;
    const { skipCommit, skipCheckMate, skipStaleMate, state: _state } = options ?? {};
    const state = _state || this.state;
    let nextState = [...state];
    const [from, to, ...rest] = notation.split(" ");
    
    const gameState = this.getGameState(state);
    const isInitiallyWhiteTurn = gameState.turn === GAME_STATE.WHITE_TURN;
    const modifierValue = from.startsWith("ADD_MODIFIER") ? MODIFIER_INDEX[rest[0]] as TILE_MODIFIERS : null;
    const modifierPlayer = from.split("ADD_MODIFIER_")[1];
    const isStickyModifier = STICKY_MODIFIERS.has(modifierValue as TILE_MODIFIERS);
    if(isStickyModifier) {
      // debugger;
      if((modifierPlayer === "WHITE" && !isInitiallyWhiteTurn) || (modifierPlayer === "BLACK" && isInitiallyWhiteTurn)) {
        return MOVE_RETURN_VALUES.INVALID;
      }

      const [ modifierInput ] = rest;
      const targetIndex = SQUARE_INDEX_MAP[to];
      const modifierValue = MODIFIER_INDEX[modifierInput] as TILE_MODIFIERS;
      const modifierChar = MODIFIER_CHAR[modifierValue];
      const playerCards = [...(isInitiallyWhiteTurn ? this.getCards().whiteCards : this.getCards().blackCards)];
      const playerCardIndex = playerCards.indexOf(modifierChar);

      if(playerCardIndex < 0) {
        return MOVE_RETURN_VALUES.INVALID;
      }

      const currentPieceWColour = this.extractPieceWColourFromSquareIndex(targetIndex, state);
      const currentModifier = this.extractModifierFromSquareIndex(targetIndex, state);
      const square = state[targetIndex];
      const currentPiece = this.extractPiece(square);

      // can now place modifiers in filled spaces too
      const emptyPlaceModifiers = new Set([
        TILE_MODIFIERS.PORTAL,
      ]);

      if(emptyPlaceModifiers.has(modifierValue) && currentPiece !== PIECES.EMPTY && currentPiece !== PIECES.EN_PASSANT) {
        return MOVE_RETURN_VALUES.INVALID;
      }
      
      if(modifierValue === TILE_MODIFIERS.CLEAR_MODIFIER) {
        nextState[targetIndex] = currentPieceWColour;
      } else if(currentModifier && modifierValue !== TILE_MODIFIERS.SHOVE_PAWN) {
        return MOVE_RETURN_VALUES.INVALID;
      } else {
        if(modifierValue === TILE_MODIFIERS.TRENCH) {
          if(isInitiallyWhiteTurn && currentPieceWColour !== (PIECES.WHITE | PIECES.PAWN)) {
            return MOVE_RETURN_VALUES.INVALID;
          }

          if(!isInitiallyWhiteTurn && currentPieceWColour !== (PIECES.BLACK | PIECES.PAWN)) {
            return MOVE_RETURN_VALUES.INVALID;
          }
        }
        if(modifierValue === TILE_MODIFIERS.REVERSE_PAWN && currentPiece !== PIECES.PAWN) {
          return MOVE_RETURN_VALUES.INVALID;
        }

        if(modifierValue === TILE_MODIFIERS.SHOVE_PAWN) {
          debugger;
          if(currentPiece !== PIECES.PAWN) {
            return MOVE_RETURN_VALUES.INVALID;
          }
          const isOwnPawn = (isInitiallyWhiteTurn && currentPieceWColour === (PIECES.WHITE | PIECES.PAWN)) || (!isInitiallyWhiteTurn && currentPieceWColour === (PIECES.BLACK | PIECES.PAWN));
          const secondToLastRow = new Set("abcdefgh".split("").map((col) => isInitiallyWhiteTurn ? `${col}7` : `${col}2`));
          const targetPosition = this.indexToPosition(targetIndex);
          
          // can't promote by shoving
          if(secondToLastRow.has(targetPosition) && isOwnPawn) {
            return MOVE_RETURN_VALUES.INVALID;
          }

          const destinationSquareIndex = isInitiallyWhiteTurn ? targetIndex + 8 : targetIndex - 8;
          if(destinationSquareIndex < 0 || destinationSquareIndex > 63) {
            return MOVE_RETURN_VALUES.INVALID;
          }

          // destination has to be empty
          const destinationSquarePiece = this.extractPiece(state[destinationSquareIndex]);
          const destinationSquareModifier = this.extractModifierFromSquareIndex(destinationSquareIndex, state);
          const targetSquareModifier = this.extractModifierFromSquareIndex(targetIndex, state);
          if(destinationSquarePiece !== PIECES.EMPTY && destinationSquarePiece !== PIECES.EN_PASSANT) {
            return MOVE_RETURN_VALUES.INVALID;
          }
          
          if(new Set([ TILE_MODIFIERS.TRENCH, TILE_MODIFIERS.REVERSE_PAWN ]).has(targetSquareModifier)) {
            nextState[targetIndex] ^= targetSquareModifier;
            nextState[destinationSquareIndex] = currentPieceWColour | targetSquareModifier;
          } else {
            nextState[destinationSquareIndex] = currentPieceWColour | destinationSquareModifier;
          }
          nextState[targetIndex] ^= currentPieceWColour;
        } else {
          nextState[targetIndex] = currentPieceWColour | modifierValue;
        }
      }

      playerCards.splice(playerCardIndex, 1);
      const remainingCards = playerCards.map((card) => TILE_MODIFIERS_TO_CARD_MAP[CHAR_TO_MODIFIER_MAP[card]]);
      console.log({ remainingCards });
      nextState[isInitiallyWhiteTurn ? WHITE_CARDS_INDEX : BLACK_CARDS_INDEX] = this.buildCardNumber(remainingCards);
  
      // this.switchTurns(state);
      // this.state = state;
      // this.draw();
  
      // console.log(this.state, 'STATE MODIFIER');
      // return MOVE_RETURN_VALUES.MOVE;
    } else {
      const [ promotionPiece ] = rest;
      const fromSquareIndex = SQUARE_INDEX_MAP[from];
      const toSquareIndex = SQUARE_INDEX_MAP[to];

      if (fromSquareIndex === toSquareIndex) {
        return MOVE_RETURN_VALUES.INVALID;
      }

      const fromSquare = state[fromSquareIndex];
      const fromSquareModifiers = fromSquare & BOARD_MASKS.MODIFIERS;
      const fromSquarePieceWColour = fromSquare & BOARD_MASKS.PIECE_W_COLOUR;
      const fromPieceColour = fromSquarePieceWColour & BOARD_MASKS.COLOUR;
      const fromSquarePiece = fromSquarePieceWColour & BOARD_MASKS.PIECES;
      if ((fromPieceColour === PIECES.WHITE && !isInitiallyWhiteTurn) ||
        fromPieceColour === PIECES.BLACK && isInitiallyWhiteTurn) {
        return MOVE_RETURN_VALUES.INVALID;
      }

      const [movableSquares] = this.getMovableSquares(from, state);
      if (!movableSquares.has(toSquareIndex)) {
        return MOVE_RETURN_VALUES.INVALID;
      }

      const toSquare = state[toSquareIndex];
      const toSquarePieceWColour = toSquare & BOARD_MASKS.PIECE_W_COLOUR;
      nextState[toSquareIndex] = fromSquarePieceWColour;
      const toSquareModifiers = toSquare & BOARD_MASKS.MODIFIERS;
      if(toSquareModifiers !== TILE_MODIFIERS.TRENCH && toSquareModifiers !== TILE_MODIFIERS.REVERSE_PAWN) {
        nextState[toSquareIndex] |= toSquareModifiers;
      }
      nextState[fromSquareIndex] = fromSquareModifiers;

      const WHITE_PROMOTION_ROW = "abcdefgh".split("").map((col) => `${col}8`);
      const BLACK_PROMOTION_ROW = "abcdefgh".split("").map((col) => `${col}1`);
      if(fromSquarePieceWColour === (PIECES.PAWN | PIECES.WHITE) && WHITE_PROMOTION_ROW.includes(to)) {
        if(!promotionPiece) {
          console.log("need to send promotion piece");
          return MOVE_RETURN_VALUES.INVALID;
        }

        const piece = CHAR_TO_PIECES_MAP[promotionPiece];
        nextState[toSquareIndex] = (PIECES.PAWN | PIECES.WHITE) ^ (PIECES.PAWN | PIECES.WHITE) | (piece | PIECES.WHITE);
      }
      if(fromSquarePieceWColour === (PIECES.PAWN | PIECES.BLACK) && BLACK_PROMOTION_ROW.includes(to)) {
        if(!promotionPiece) {
          console.log("need to send promotion piece");
          return MOVE_RETURN_VALUES.INVALID;
        }

        const piece = CHAR_TO_PIECES_MAP[promotionPiece];
        nextState[toSquareIndex] = (PIECES.PAWN | PIECES.BLACK) ^ (PIECES.PAWN | PIECES.BLACK) | (piece | PIECES.BLACK);
      }

      if(fromSquarePieceWColour === (PIECES.KING | PIECES.WHITE) && from === "e1") {
        if(to === "c1") {
          const rookIndex = SQUARE_INDEX_MAP["a1"];
          const rookWithColour = this.extractPieceWColourFromSquareIndex(rookIndex);
          nextState[rookIndex] = rookWithColour ^ rookWithColour;
          nextState[SQUARE_INDEX_MAP["d1"]] = rookWithColour;
        }
        
        if(to === "g1") {
          const rookIndex = SQUARE_INDEX_MAP["h1"];
          const rookWithColour = this.extractPieceWColourFromSquareIndex(rookIndex);
          nextState[rookIndex] = rookWithColour ^ rookWithColour;
          nextState[SQUARE_INDEX_MAP["f1"]] = rookWithColour;
        }
        
        this.updateCastleState({
          wkc: false,
          wqc: false,
        }, nextState);
      }
      
      if(fromSquarePieceWColour === (PIECES.KING | PIECES.BLACK) && from === "e8") {
        if(to === "c8") {
          const rookIndex = SQUARE_INDEX_MAP["a8"];
          const rookWithColour = this.extractPieceWColourFromSquareIndex(rookIndex);
          nextState[rookIndex] = rookWithColour ^ rookWithColour;
          nextState[SQUARE_INDEX_MAP["d8"]] = rookWithColour;
        }
        
        if(to === "g8") {
          const rookIndex = SQUARE_INDEX_MAP["h8"];
          const rookWithColour = this.extractPieceWColourFromSquareIndex(rookIndex);
          nextState[rookIndex] = rookWithColour ^ rookWithColour;
          nextState[SQUARE_INDEX_MAP["f8"]] = rookWithColour;
        }
        
        this.updateCastleState({
          bkc: false,
          bqc: false,
        }, nextState);
      }
      
      if(fromSquarePieceWColour === (PIECES.ROOK | PIECES.WHITE)) {
        if(from === "a1") {
          this.updateCastleState({
            wqc: false,
          }, nextState);
        }
        
        if(from === "h1") {
          this.updateCastleState({
            wkc: false,
          }, nextState);
        }
      }
      
      if(fromSquarePieceWColour === (PIECES.ROOK | PIECES.BLACK)) {
        if(from === "a8") {
          this.updateCastleState({
            bqc: false,
          }, nextState);
        }
        
        if(from === "h8") {
          this.updateCastleState({
            bkc: false,
          }, nextState);
        }
      }

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
        if(fromSquareModifiers === TILE_MODIFIERS.TRENCH) {
          nextState[fromSquareIndex] ^= TILE_MODIFIERS.TRENCH;
        }

        if(fromSquareModifiers === TILE_MODIFIERS.REVERSE_PAWN) {
          nextState[fromSquareIndex] ^= TILE_MODIFIERS.REVERSE_PAWN;
          nextState[toSquareIndex] |= TILE_MODIFIERS.REVERSE_PAWN;
        }
      }

      // we only clear this in case of a move, this can cause an issue, setting a modifier is also a move
      // but this'll only ever be an issue if say a pawn moved 2 places, and other player played a modifier
      // and the original player who moved the pawn also played a modifier, in that case the next player can
      // still target the pawn for en passant as if it just moved last turn, fixing this after shove
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
            nextState[toSquareIndex - 8] |= (PIECES.EN_PASSANT | PIECES.WHITE);
          }
        } else if (fromPieceColour === PIECES.BLACK) {
          if (fromSquareIndex >= 48 && fromSquareIndex <= 55 && toSquareIndex === fromSquareIndex - 16) {
            nextState[toSquareIndex + 8] |= (PIECES.EN_PASSANT | PIECES.BLACK);
          }
        }
      }
    }

    this.switchTurns(nextState);

    // debugger;
    const kingInDanger = this.checkKingInDanger(nextState);
    if (kingInDanger[PIECES.WHITE]) {
      // switched turns above
      if (isInitiallyWhiteTurn) {
        console.log("TIS ILLEGAL");
        
        if(this.toggleIllegalState(PIECES.WHITE, { skipCommit })) {
          return MOVE_RETURN_VALUES.ILLEGAL;
        } else {
          console.log("ILLEGAL 2, MATE");
          return MOVE_RETURN_VALUES.ILLEGAL;
          // I want to keep illegal move mate around but people aren't used to illegal moves in online chess
          // imo in pawn endgames with lots of portals, players have to be very careful while moving their king
          // I think it's more fun that way, so maybe a solution is to increase the number of illegals allowed and 
          // advertise the count properly in the game interface.

          // temporarily disabling it though
          // return MOVE_RETURN_VALUES.CHECKMATE;
        }
      } else {
        console.log("CHECK!");
        if(!skipCheckMate && this.checkMate(PIECES.WHITE, nextState)) {
          console.log("CHECKMATE!!");
          if(!skipCommit) {
            this.state = nextState;
          }
          return MOVE_RETURN_VALUES.CHECKMATE;
        }
      }
    }

    if (kingInDanger[PIECES.BLACK]) {
      // switched turns above
      if (!isInitiallyWhiteTurn) {
        console.log("TIS ILLEGAL");

        if(this.toggleIllegalState(PIECES.BLACK, { skipCommit })) {
          return MOVE_RETURN_VALUES.ILLEGAL;
        } else {
          console.log("ILLEGAL 2, MATE");
          // remove illegal mates temporarily
          return MOVE_RETURN_VALUES.ILLEGAL;
        }
      } else {
        console.log("CHECK!");
        if(!skipCheckMate && this.checkMate(PIECES.BLACK, nextState)) {
          console.log("CHECKMATE!!");
          if(!skipCommit) {
            this.state = nextState;
          }
          return MOVE_RETURN_VALUES.CHECKMATE;
        }
      }
    }

    // black's turn: !check, !legal moves = stalemate
    // stalemate
    // if(!skipStaleMate) {
    //   // black's turn
    //   if(isInitiallyWhiteTurn) {
    //     if(!kingInDanger[PIECES.BLACK]) {
          
    //     }
    //   }
    // }

    // stalemate
    if(!skipStaleMate && this.checkStaleMate(nextState)) {
      console.log("STALEMATE");
      if(!skipCommit) {
        this.state = nextState
      }
      return MOVE_RETURN_VALUES.STALEMATE;
    }

    // repeat draw
    const positionStr = nextState.slice(0, GAME_STATE_INDEX).join();
    if(this.positionCountMap.get(positionStr) === 2) {
      console.log("REPEAT DRAW");
      
      if(!skipCommit) {
        this.state = nextState
      }
      return MOVE_RETURN_VALUES.REPEATDRAW;
    } else {
      const currentCount = this.positionCountMap.get(positionStr) ?? 0;
      if(!skipCommit) {
        this.positionCountMap.set(positionStr, currentCount + 1);
      }
    }
  
    if(!skipCommit) {
      if(isInitiallyWhiteTurn) {
        nextState[WHITE_CARD_DRAW_COUNTER_INDEX] = nextState[WHITE_CARD_DRAW_COUNTER_INDEX] - 1;
      } else {
        nextState[BLACK_CARD_DRAW_COUNTER_INDEX] = nextState[BLACK_CARD_DRAW_COUNTER_INDEX] - 1;
      }
      this.state = nextState;
      console.log(this.state, "STATE");
    }
    return MOVE_RETURN_VALUES.MOVE;
  }

  undoMove() {
    if(this.stateHistory.length > 1) {
      console.log("UNDO MOVE", this.stateHistory.length);
      const removedHistory = this.stateHistory.pop() ?? [];
      // repeat draw
      // since we replace instead of pushing state on card selection, popping without checking can cause issues
      // however, it'll be fine if we just don't do anything on card selection when looking through the history view
      const positionStr = removedHistory.slice(0, GAME_STATE_INDEX).join();
      const currentCount = this.positionCountMap.get(positionStr);
      if(!currentCount) {
        console.log("SOMETHING's WRONG, position not mapped but present in history");
      } else {
        this.positionCountMap.set(positionStr, currentCount - 1);
      }
      console.log("UNDO MOVE DONE", this.stateHistory.length);
    }
  }
  
  toggleIllegalState(colour: PIECES.WHITE | PIECES.BLACK, options: { _state?: number[], skipCommit?: boolean }) {
    const { _state, skipCommit } = options;
    const state = _state || this.state;
    let gameState = state[GAME_STATE_INDEX];
    if(colour === PIECES.WHITE) {
      const currentValue = gameState & GAME_STATE_MASKS.W_ILLEGAL;
      if(currentValue === GAME_STATE_MASKS.W_ILLEGAL) {
        gameState = gameState ^ GAME_STATE_MASKS.W_ILLEGAL;
      } else {
        return false;
      }
    }

    if(colour === PIECES.BLACK) {
      const currentValue = gameState & GAME_STATE_MASKS.B_ILLEGAL;
      if(currentValue === GAME_STATE_MASKS.B_ILLEGAL) {
        gameState = gameState ^ GAME_STATE_MASKS.B_ILLEGAL;
      } else {
        return false;
      }
    }
    if(!skipCommit) {
      state[GAME_STATE_INDEX] = gameState;
    }
    return true;
  }

  updateCastleState(castleState: Partial<Record<CastleStateOptions, boolean>>, _state?: number[]) {
    const state = _state || this.state;
    let gameState = state[GAME_STATE_INDEX];
    const effectiveMaskMap = {
      [CastleStateOptions.wkc]: GAME_STATE_MASKS.WK_CASTLE,
      [CastleStateOptions.wqc]: GAME_STATE_MASKS.WQ_CASTLE,
      [CastleStateOptions.bkc]: GAME_STATE_MASKS.BK_CASTLE,
      [CastleStateOptions.bqc]: GAME_STATE_MASKS.BQ_CASTLE,
    };

    for(const [ key, value ] of Object.entries(castleState)) {
      const mask = effectiveMaskMap[key as CastleStateOptions];
      if(mask !== undefined) {
        const currentValue = gameState & mask;
        if(currentValue === mask) {
          gameState = value === true ? gameState | mask : gameState ^ mask;
        }
      }
    }
    
    state[GAME_STATE_INDEX] = gameState;
  }

  switchTurns(_state?: number[]) {
    // change turns
    const state = _state || this.state;
    const currentTurn = this.getGameState(state).turn;
    const nextTurn = currentTurn === GAME_STATE.WHITE_TURN ? GAME_STATE.BLACK_TURN : GAME_STATE.WHITE_TURN;
    const gameState = state[GAME_STATE_INDEX];
    const newGameState = gameState ^ currentTurn | nextTurn;
    state[GAME_STATE_INDEX] = newGameState;
  }
  
  checkStaleMate(_state: number[]) {
    // debugger;
    const state = _state || this.state;
    const currentTurn = this.getGameState(state).turn;
    const colour = currentTurn === GAME_STATE.WHITE_TURN ? PIECES.WHITE : PIECES.BLACK;
    const boardSquares = state.slice(0, GAME_STATE_INDEX);
    const colouredPiecesPositions = boardSquares.map((square, index) => {
      if(this.extractColour(square) === colour) {
        return this.indexToPosition(index);
      }
    }).filter(Boolean) as string[];
    
    return !colouredPiecesPositions.some((position) => {
      const [ movableSquares ] = this.getMovableSquares(position, state);
      
      return Array.from(movableSquares).some((squareIndex) => {
        const moveStr = `${position} ${this.indexToPosition(squareIndex)}`;
        return this.move(moveStr, { skipCommit: true, skipStaleMate: true, skipCheckMate: true, state }) === MOVE_RETURN_VALUES.MOVE;
      });
    });
  }

  checkMate(colour: PIECES.WHITE | PIECES.BLACK, _state?: number[]) {
    // debugger;
    const state = _state || this.state;
    const boardSquares = state.slice(0, GAME_STATE_INDEX);

    const colouredPiecesPositions = boardSquares.map((square, index) => {
      if(this.extractColour(square) === colour) {
        return this.indexToPosition(index);
      }
    }).filter(Boolean) as string[];
    
    return !colouredPiecesPositions.some((position) => {
      const [ movableSquares ] = this.getMovableSquares(position, state);
      console.log(movableSquares, "from checkmate!!!");

      return Array.from(movableSquares).some((squareIndex) => {
        const moveStr = `${position} ${this.indexToPosition(squareIndex)}`;
        const moveRes = this.move(moveStr, { skipCommit: true, skipStaleMate: true, skipCheckMate: true, state });
        console.log(moveStr, moveRes, moveRes === MOVE_RETURN_VALUES.MOVE, "from checkmate!!!!!");
        return this.move(moveStr, { skipCommit: true, skipStaleMate: true, skipCheckMate: true, state }) === MOVE_RETURN_VALUES.MOVE;
      });
    });
  }

  getKingSquareIndexMap(_state: number[]) {
    const state = _state || this.state;
    const kingIndexMap = {[PIECES.WHITE]: -1, [PIECES.BLACK]: -1};
    state.forEach((_, index) => {
      const piece = this.extractPieceWColourFromSquareIndex(index, state);
      if(piece === (PIECES.KING | PIECES.WHITE)) {
        kingIndexMap[PIECES.WHITE] = index;
      }
      if(piece === (PIECES.KING | PIECES.BLACK)) {
        kingIndexMap[PIECES.BLACK] = index;
      }
    });
    
    return kingIndexMap;
  }
  
  checkKingInDanger(_state: number[]) {
    // debugger;
    const state = _state || this.state;
    const kingSquareIndices = Object.values(this.getKingSquareIndexMap(state));

    const dangerMap: Record<number, boolean> = {};
    for (const squareIndex of kingSquareIndices) {
      const square = state[squareIndex];
      const colour = this.extractColour(square);
      const location = LOCATION_MAP[squareIndex];
      const collisionPieces = colour === PIECES.WHITE ? WHITE_PIECES : BLACK_PIECES;
      const modifier = this.extractModifierFromSquareIndex(squareIndex, state);
      const skipPortal = modifier !== TILE_MODIFIERS.PORTAL;
      dangerMap[colour] = this.checkSquareInDanger(location, colour, collisionPieces, { state, skipModifiers: { skipPortal } });
    }
    return dangerMap;
  }
  
  getAttackingTargetSquares(location: string, colour: number, collisionPieces: Set<number>, options: { state?: number[], skipModifiers?: SkipModifiersOptions; }) {
    // debugger;
    const { state: _state, skipModifiers } = options;
    const skipPortal = skipModifiers?.skipPortal;
    const state = _state || this.state;
    const squareIndex = SQUARE_INDEX_MAP[location];
    const targetPieces = ALL_PIECES.difference(collisionPieces);
    const pawnDirection = colour === PIECES.WHITE ? DIRECTION.W_PAWN : DIRECTION.B_PAWN;
    const reversePawnDirection = colour === PIECES.WHITE ? DIRECTION.W_PAWN_REVERSE : DIRECTION.B_PAWN_REVERSE;
    const [, plusSquares] = this.getSquaresInDirection(location, DIRECTION.PLUS, { collisionPieces: collisionPieces, state, skipModifiers: { skipPortal } });
    const [, diagonalSquares] = this.getSquaresInDirection(location, DIRECTION.DIAGONAL, { collisionPieces: collisionPieces, state, skipModifiers: { skipPortal } });
    const [, knightSqaures] = this.getSquaresInDirection(location, DIRECTION.KNIGHT, { collisionPieces: collisionPieces, state, skipModifiers: { skipPortal } });
    const [, _pawnSquares] = this.getSquaresInDirection(location, pawnDirection, { collisionPieces: collisionPieces, state, depth: 1, skipModifiers: { skipPortal } });
    const [, _reversePawnSquares] = this.getSquaresInDirection(location, reversePawnDirection, { collisionPieces: collisionPieces, state, depth: 1, skipModifiers: { skipPortal } });
    const [, kingSquares] = this.getSquaresInDirection(location, DIRECTION.ALL, { collisionPieces: new Set([ PIECES.KING | colour ]), state, depth: 1, skipModifiers: { skipPortal } });
    const [allPortalSquares] = skipPortal ? [new Set<number>(), new Set<number>()] : this.getSquaresWithPortalFromSquareIndexArr([ squareIndex ], targetPieces, state);

    const pawnSquares = new Set(Array.from(_pawnSquares).filter((squareIndex) => {
      const piece = this.extractPiece(state[squareIndex]);
      const modifier = this.extractModifierFromSquareIndex(squareIndex, state);
      if(piece === PIECES.PAWN && modifier === TILE_MODIFIERS.REVERSE_PAWN) {
        return false;
      }
      return true;
    }));
    const reversePawnSquares = new Set(Array.from(_reversePawnSquares).filter((squareIndex) => {
      const piece = this.extractPiece(state[squareIndex]);
      const modifier = this.extractModifierFromSquareIndex(squareIndex, state);
      if(piece === PIECES.PAWN && modifier === TILE_MODIFIERS.REVERSE_PAWN) {
        return true;
      }
      return false;
    }));
    const portalAttacks: number[] = [];
    Array.from(allPortalSquares).forEach((squareIndex) => {
      const targetSquaresMap = this.getAttackingTargetSquares(LOCATION_MAP[squareIndex], colour, collisionPieces, { state, skipModifiers: { skipPortal: true } });
      Object.values(targetSquaresMap).forEach((targetSquareSet) => portalAttacks.push(...Array.from(targetSquareSet)));
    });

    const DIAGONAL_DANGER = new Set([PIECES.BISHOP, PIECES.QUEEN]);
    const PLUS_DANGER = new Set([PIECES.ROOK, PIECES.QUEEN]);

    return Object.fromEntries([
      ["plus", new Set(Array.from(plusSquares).filter((sIndex) => PLUS_DANGER.has(this.extractPiece(state[sIndex]))))],
      ["diagonal", new Set(Array.from(diagonalSquares).filter((sIndex) => DIAGONAL_DANGER.has(this.extractPiece(state[sIndex]))))],
      ["knight", new Set(Array.from(knightSqaures).filter((sIndex) => PIECES.KNIGHT === this.extractPiece(state[sIndex])))],
      ["pawn", new Set(Array.from(pawnSquares).filter((sIndex) => PIECES.PAWN === this.extractPiece(state[sIndex])))],
      ["reversepawn", new Set(Array.from(reversePawnSquares).filter((sIndex) => PIECES.PAWN === this.extractPiece(state[sIndex])))],
      ["king", new Set(Array.from(kingSquares).filter((sIndex) => PIECES.KING === this.extractPiece(state[sIndex])))],
      ["portal", new Set(portalAttacks)],
    ]);
  }
  
  checkSquareInDanger(location: string, colour: number, collisionPieces: Set<number>, options: { state?: number[], skipModifiers?: SkipModifiersOptions }) {
    const { state: _state, skipModifiers } = options;
    const squares = this.getAttackingTargetSquares(location, colour, collisionPieces, { state: _state, skipModifiers });
    console.log({ squares });
    return Object.values(squares).some((v) => v.size > 0);
  }

  addModifier(location: string, modifier: string | number, _state?: number[]) {
    const state = _state || this.state;
    const targetIndex = SQUARE_INDEX_MAP[location];
    const modifierValue = MODIFIER_INDEX[modifier];
    const currentPieceWColour = this.extractPieceWColourFromSquareIndex(targetIndex, state);
    state[targetIndex] = currentPieceWColour | modifierValue;

    this.switchTurns(state);
    this.state = state;
    this.draw();

    return MOVE_RETURN_VALUES.MOVE;
  }

  getSquaresWithinBoundary(start: number, directionMod: number, boundary: Set<number>, options: { depth?: number; collisionPieces?: Set<number>; state?: number[] }) {
    const { depth: _depth = 8, collisionPieces, state: _state } = options;
    const state = _state || this.state;
    const targetPieces = collisionPieces ? ALL_PIECES.difference(collisionPieces) : null;
    let depth = _depth;
    const squares = [];
    const targetOnlySquares = [];
    let currentLocation = start + directionMod;
    while (currentLocation >= 0 && currentLocation < 64 && depth--) {
      const prevLocation = currentLocation - directionMod;
      if (boundary.has(currentLocation) && boundary.has(prevLocation) && prevLocation !== start) {
        break;
      }

      const pieceWColour = this.extractPieceWColourFromSquareIndex(currentLocation, state);
      const squareVal = state[currentLocation];
  
      if (!collisionPieces?.has(pieceWColour)) {
        // for trench
        if(!collisionPieces?.has(squareVal)) {
          squares.push(currentLocation);
        }

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

  getSquaresInDirection(location: string, direction: DIRECTION, options: { depth?: number; collisionPieces?: Set<number>; state?: number[]; skipModifiers?: SkipModifiersOptions; }) {
    const { collisionPieces, state: _state, skipModifiers } = options;
    const state = _state || this.state;
    const squareIndex = SQUARE_INDEX_MAP[location];
    const leftWall = new Set([0, 8, 16, 24, 32, 40, 48, 56]);
    const rightWall = new Set([7, 15, 23, 31, 39, 47, 55, 63]);
    const topWall = new Set([56, 57, 58, 59, 60, 61, 62, 63]);
    const bottomWall = new Set([0, 1, 2, 3, 4, 5, 6, 7,]);
    const horizontalBoundary = new Set([...bottomWall, ...topWall]);
    const verticalBoundary = new Set([...leftWall, ...rightWall]);
    const squareBoundary = new Set([...horizontalBoundary, ...verticalBoundary]);

    let targetPieces = collisionPieces ? ALL_PIECES.difference(collisionPieces) : null;

    const squares: Array<number[] | number> = [];
    const targetOnlySquares: Array<number[] | number> = [];
    if (direction === DIRECTION.PLUS || direction === DIRECTION.ALL) {
      const left = !leftWall.has(squareIndex) ? this.getSquaresWithinBoundary(squareIndex, -1, verticalBoundary, options) : [];
      const right = !rightWall.has(squareIndex) ? this.getSquaresWithinBoundary(squareIndex, 1, verticalBoundary, options) : [];
      const up = !topWall.has(squareIndex) ? this.getSquaresWithinBoundary(squareIndex, +8, horizontalBoundary, options) : [];
      const down = !bottomWall.has(squareIndex) ? this.getSquaresWithinBoundary(squareIndex, -8, horizontalBoundary, options) : [];
      squares.push(left[0], right[0], up[0], down[0]);
      targetOnlySquares.push(left[1], right[1], up[1], down[1]);
    }

    if (direction === DIRECTION.DIAGONAL || direction === DIRECTION.ALL) {
      const topLeft = !leftWall.has(squareIndex) ? this.getSquaresWithinBoundary(squareIndex, 7, squareBoundary, options) : [];
      const topRight = !rightWall.has(squareIndex) ? this.getSquaresWithinBoundary(squareIndex, 9, squareBoundary, options) : [];
      const bottomLeft = !leftWall.has(squareIndex) ? this.getSquaresWithinBoundary(squareIndex, -9, squareBoundary, options) : [];
      const bottomRight = !rightWall.has(squareIndex) ? this.getSquaresWithinBoundary(squareIndex, -7, squareBoundary, options) : [];
      squares.push(topLeft[0], topRight[0], bottomLeft[0], bottomRight[0]);
      targetOnlySquares.push(topLeft[1], topRight[1], bottomLeft[1], bottomRight[1]);
    }

    if (direction === DIRECTION.DIAGONAL_TOP) {
      const topLeft = !leftWall.has(squareIndex) ? this.getSquaresWithinBoundary(squareIndex, 7, squareBoundary, options) : [];
      const topRight = !rightWall.has(squareIndex) ? this.getSquaresWithinBoundary(squareIndex, 9, squareBoundary, options) : [];
      squares.push(topLeft[0], topRight[0]);
      targetOnlySquares.push(topLeft[1], topRight[1]);
    }

    if (direction === DIRECTION.DIAGONAL_BOTTOM) {
      const bottomLeft = !leftWall.has(squareIndex) ? this.getSquaresWithinBoundary(squareIndex, -9, squareBoundary, options) : [];
      const bottomRight = !rightWall.has(squareIndex) ? this.getSquaresWithinBoundary(squareIndex, -7, squareBoundary, options) : [];
      squares.push(bottomLeft[0], bottomRight[0]);
      targetOnlySquares.push(bottomLeft[1], bottomRight[1]);
    }

    if (direction === DIRECTION.KNIGHT) {
      const plusDirWithinBoundary = this.getSquaresInDirection(location, DIRECTION.PLUS, { depth: 2, state });
      const ekBeModsVertical = [16, -16];
      const ekBeModsHorizontal = [2, -2];
      ekBeModsVertical.forEach((mod) => {
        const beSquare = squareIndex + mod;
        if (plusDirWithinBoundary[0].has(beSquare)) {
          if (!leftWall.has(beSquare)) {
            const finalIndex = beSquare - 1;
            const pieceWColour = this.extractPieceWColourFromSquareIndex(finalIndex, state);
            if (!collisionPieces?.has(pieceWColour)) {
              squares.push(finalIndex);

              if (targetPieces?.has(pieceWColour)) {
                targetOnlySquares.push(finalIndex);
              }
            }
          }
          if (!rightWall.has(beSquare)) {
            const finalIndex = beSquare + 1;
            const pieceWColour = this.extractPieceWColourFromSquareIndex(finalIndex, state);
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
            const pieceWColour = this.extractPieceWColourFromSquareIndex(finalIndex, state);
            if (!collisionPieces?.has(pieceWColour)) {
              squares.push(finalIndex);

              if (targetPieces?.has(pieceWColour)) {
                targetOnlySquares.push(finalIndex);
              }
            }
          }
          if (!topWall.has(beSquare)) {
            const finalIndex = beSquare + 8;
            const pieceWColour = this.extractPieceWColourFromSquareIndex(finalIndex, state);
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

    if ([DIRECTION.PAWN, DIRECTION.B_PAWN, DIRECTION.W_PAWN, DIRECTION.W_PAWN_REVERSE, DIRECTION.B_PAWN_REVERSE].includes(direction)) {
      const locationSquare = state[squareIndex];
      const colour = this.extractColour(locationSquare);

      // not sure if I want to tag "unmoved" pieces,
      // I'll just allow the pawn to move two squares if they're in the 2nd closest row to the players
      if (direction === DIRECTION.W_PAWN || (colour === PIECES.WHITE && direction === DIRECTION.PAWN) || direction === DIRECTION.B_PAWN_REVERSE) {
        const collisionPieces = direction === DIRECTION.B_PAWN_REVERSE ? new Set([...BLACK_PIECES, PIECES.EN_PASSANT | PIECES.BLACK, PIECES.EMPTY]) : new Set([...WHITE_PIECES, PIECES.EN_PASSANT | PIECES.WHITE, PIECES.EMPTY]);
        targetPieces = ALL_PIECES.difference(collisionPieces);
        const captureSquares = this.getSquaresInDirection(location, DIRECTION.DIAGONAL_TOP, { depth: 1, collisionPieces, state });
        const pieceWColour = this.extractPieceWColourFromSquareIndex(squareIndex + 8, state);
        if (!ALL_PIECES.has(pieceWColour)) {
          squares.push(squareIndex + 8);

          if (squareIndex >= 8 && squareIndex <= 15) {
            const pieceWColour = this.extractPieceWColourFromSquareIndex(squareIndex + 16, state);
            if (!ALL_PIECES.has(pieceWColour)) {
              squares.push(squareIndex + 16);
            }
          }
        }
        captureSquares[0].forEach((s) => squares.push(s));
        captureSquares[1].forEach((s) => targetOnlySquares.push(s));
      } else if (direction === DIRECTION.B_PAWN || (colour === PIECES.BLACK && direction === DIRECTION.PAWN) || direction === DIRECTION.W_PAWN_REVERSE) {
        const collisionPieces = direction === DIRECTION.W_PAWN_REVERSE ? new Set([...WHITE_PIECES, PIECES.EN_PASSANT | PIECES.WHITE, PIECES.EMPTY]) : new Set([...BLACK_PIECES, PIECES.EN_PASSANT | PIECES.BLACK, PIECES.EMPTY]);
        targetPieces = ALL_PIECES.difference(collisionPieces);

        const captureSquares = this.getSquaresInDirection(location, DIRECTION.DIAGONAL_BOTTOM, { depth: 1, collisionPieces, state });
        const pieceWColour = this.extractPieceWColourFromSquareIndex(squareIndex - 8, state);
        if (!ALL_PIECES.has(pieceWColour)) {
          squares.push(squareIndex - 8);

          if (squareIndex >= 48 && squareIndex <= 55) {
            const pieceWColour = this.extractPieceWColourFromSquareIndex(squareIndex - 16, state);
            if (!ALL_PIECES.has(pieceWColour)) {
              squares.push(squareIndex - 16);
            }
          }
        }
        captureSquares[0].forEach((s) => squares.push(s));
        captureSquares[1].forEach((s) => targetOnlySquares.push(s));
      }
    }

    // only pawn and knight has any special target pieces and both cases won't ever do a recursive call so this is fine for now
    let squareIndexSet = new Set(squares.filter((a) => a !== undefined).flat());
    let targetIndexSet = new Set(targetOnlySquares.filter((a) => a !== undefined).flat());
    if(!skipModifiers?.skipPortal) {
      const squaresWithoutTargets = Array.from([...squareIndexSet.difference(targetIndexSet), squareIndex]);
      const [ _squareIndexSet, _targetIndexSet ] = this.getSquaresWithPortalFromSquareIndexArr(squaresWithoutTargets, targetPieces, state);
      squareIndexSet = squareIndexSet.union(_squareIndexSet);
      targetIndexSet = targetIndexSet.union(_targetIndexSet);
    }

    return [ squareIndexSet, targetIndexSet ];
  }

  getSquaresWithPortalFromSquareIndexArr(squareIndexArr: number[], targetPieces: Set<number> | null, _state?: number[]) {
    const squareIndexSet = new Set<number>();
    const targetIndexSet = new Set<number>();
    const state = _state || this.state;
    const hasPortal = squareIndexArr.some((squareIndex) => {
      const modifier = this.extractModifierFromSquareIndex(squareIndex, state);
      return modifier === TILE_MODIFIERS.PORTAL;
    });

    if(hasPortal) {
      const collisionPieces = ALL_PIECES.difference(targetPieces ?? new Set());
      const allPortalSquareIndexes = state.slice(0, GAME_STATE_INDEX).map((_square, index) => {
        const modifier = this.extractModifierFromSquareIndex(index, state);
        return modifier === TILE_MODIFIERS.PORTAL ? index : null;
      }).filter(Boolean) as number[];

      allPortalSquareIndexes.forEach((index) => {
        const pieceWColour = this.extractPieceWColourFromSquareIndex(index, state);
        if(!collisionPieces.has(pieceWColour)) {
          squareIndexSet.add(index);
        }
        if(targetPieces?.has(pieceWColour)) {
          targetIndexSet.add(index);
        }
      });
    }

    return [ squareIndexSet, targetIndexSet ];
  }

  getMovableSquares(location: string, _state?: number[]) {
    // debugger;
    const state = _state || this.state;
    const squareIndex = SQUARE_INDEX_MAP[location];
    const locationSquare = state[squareIndex];

    const currentPiece = this.extractPiece(locationSquare);
    const currentModifier = this.extractModifierFromSquareIndex(squareIndex, state);
    const colour = this.extractColour(locationSquare);
    const collisionPieces = colour === PIECES.WHITE ? WHITE_PIECES : BLACK_PIECES;
    collisionPieces.add(colour === PIECES.WHITE ? (PIECES.PAWN | PIECES.BLACK | TILE_MODIFIERS.TRENCH) : (PIECES.PAWN | PIECES.WHITE | TILE_MODIFIERS.TRENCH))

    if (currentPiece === PIECES.KNIGHT) {
      return this.getSquaresInDirection(location, DIRECTION.KNIGHT, { collisionPieces, state });
    }

    if (currentPiece === PIECES.QUEEN) {
      return this.getSquaresInDirection(location, DIRECTION.ALL, { collisionPieces, state });
    }

    if (currentPiece === PIECES.KING) {
      const [ reqularSquares, targetOnlySquares ] = this.getSquaresInDirection(location, DIRECTION.ALL, { depth: 1, collisionPieces, state });
      const castleSquares = ((colour === PIECES.WHITE && location === "e1") || (colour === PIECES.BLACK && location === "e8")) 
        ? this.getCastleSquares(colour, state) : new Set<number>();
      
      return [ new Set([ ...reqularSquares, ...castleSquares ]), targetOnlySquares ];
    }

    if (currentPiece === PIECES.BISHOP) {
      return this.getSquaresInDirection(location, DIRECTION.DIAGONAL, { collisionPieces, state });
    }

    if (currentPiece === PIECES.ROOK) {
      return this.getSquaresInDirection(location, DIRECTION.PLUS, { collisionPieces, state });
    }

    if (currentPiece === PIECES.PAWN) {
      let direction = DIRECTION.PAWN;
      if(currentModifier === TILE_MODIFIERS.REVERSE_PAWN) {
        if(colour === PIECES.WHITE) {
          direction = DIRECTION.W_PAWN_REVERSE;
        } else {
          direction = DIRECTION.B_PAWN_REVERSE;
        }
      }
      return this.getSquaresInDirection(location, direction, { collisionPieces, state });
    }

    return [new Set<number>(), new Set<number>()];
  }

  getCastleSquares(colour: number, _state?: number[]) {
    // debugger;
    const state = _state || this.state;
    const gameState = this.getGameState(state);
    const castleSquares = new Set<number>();
    if(colour === PIECES.WHITE) {
      const collisionPieces = WHITE_PIECES;
      const kingSquare = "e1";
      if(gameState.wkc) {
        const emptySquares = [ "f1", "g1" ];
        const squareLocationsToCheck = [ kingSquare, ...emptySquares ];
        if(emptySquares.every((location) => this.extractPiece(state[SQUARE_INDEX_MAP[location]]) === PIECES.EMPTY) && !squareLocationsToCheck.some((location) => this.checkSquareInDanger(location, colour, collisionPieces, { state }))) {
          castleSquares.add(SQUARE_INDEX_MAP["g1"]);
        }
      }
      if(gameState.wqc) {
        const emptySquares = [ "d1", "c1" ];
        const squareLocationsToCheck = [ kingSquare, ...emptySquares ];
        if(emptySquares.every((location) => this.extractPiece(state[SQUARE_INDEX_MAP[location]]) === PIECES.EMPTY) && !squareLocationsToCheck.some((location) => this.checkSquareInDanger(location, colour, collisionPieces, { state }))) {
          castleSquares.add(SQUARE_INDEX_MAP["c1"]);
        }
      }
    }
    
    if(colour === PIECES.BLACK) {
      const collisionPieces = BLACK_PIECES;
      const kingSquare = "e8";
      if(gameState.bkc) {
        const emptySquares = [ "f8", "g8" ];
        const squareLocationsToCheck = [ kingSquare, ...emptySquares ];
        if(emptySquares.every((location) => this.extractPiece(state[SQUARE_INDEX_MAP[location]]) === PIECES.EMPTY) && !squareLocationsToCheck.some((location) => this.checkSquareInDanger(location, colour, collisionPieces, { state }))) {
          castleSquares.add(SQUARE_INDEX_MAP["g8"]);
        }
      }
      if(gameState.bqc) {
        const emptySquares = [ "d8", "c8" ];
        const squareLocationsToCheck = [ kingSquare, ...emptySquares ];
        if(emptySquares.every((location) => this.extractPiece(state[SQUARE_INDEX_MAP[location]]) === PIECES.EMPTY) && !squareLocationsToCheck.some((location) => this.checkSquareInDanger(location, colour, collisionPieces, { state }))) {
          castleSquares.add(SQUARE_INDEX_MAP["c8"]);
        }
      }
    }
    
    return castleSquares;
  }
}
