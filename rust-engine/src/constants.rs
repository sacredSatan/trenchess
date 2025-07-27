pub struct Pieces;

impl Pieces {
  pub const PAWN: u16 = 0b00_001;
  pub const ROOK: u16 = 0b00_010;
  pub const BISHOP: u16 = 0b00_011;
  pub const KNIGHT: u16 = 0b00_100;
  pub const QUEEN: u16 = 0b00_101;
  pub const KING: u16 = 0b00_110;
  pub const EN_PASSANT: u16 = 0b00_111;
  pub const WHITE: u16 = 0b01_000;
  pub const BLACK: u16 = 0b10_000;
  pub const EMPTY: u16 = 0;
}

pub struct TileModifiers;

impl TileModifiers {
  pub const TRENCH: u16 = 0b0001_00000;
  pub const PORTAL: u16 = 0b0010_00000;
  pub const REVERSE_PAWN: u16 = 0b0111_00000;
  pub const CLEAR_MODIFIER: u16 = 0b0110_00000;
  pub const SHOVE_PAWN: u16 = 0b0101_00000;
}

pub struct BoardMasks;

impl BoardMasks {
  pub const PIECES: u16 = 0b111;
  pub const COLOUR: u16 = 0b11_000;
  pub const MODIFIERS: u16 = 0b1111_00000;
}
