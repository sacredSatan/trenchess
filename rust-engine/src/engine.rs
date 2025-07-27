use crate::constants::*;
use web_sys::console;

pub struct Engine {
  pub state: [u16; 64],
}

// let's just see if I can parse and just draw the board from state
impl Engine {
  /// Create a new engine with empty state
  pub fn new() -> Self {
    Engine {
      state: [0; 64]
    }
  }

  pub fn set_state(&mut self, new_state: &[u16]) {
    if new_state.len() >= 64 {
      self.state.copy_from_slice(&new_state[0..64]);
    }
  }

  pub fn draw(&self) {
    let mut row_str = String::new();
    row_str.push_str("  rust draw\n");
    row_str.push_str("  +-------------------------+");

    for rank in (1..=8).rev() {
        row_str.push_str(&format!("\n{} | ", rank));
        
        for file in 0..8 {
          let index = (rank - 1) * 8 + file;
          let square = self.state[index];
          let stc = self.square_to_char(&square);
          row_str.push_str(&stc);
          row_str.push(' ');
        }
    }

    row_str.push_str("\n  +-------------------------+");
    row_str.push_str("\n    a  b  c  d  e  f  g  h");

    console::log_1(&row_str.into()); 
  }

  fn extract_piece(&self, square: &u16) -> u16 {
    square & BoardMasks::PIECES
  }

  fn extract_colour(&self, square: &u16) -> u16 {
    square & BoardMasks::COLOUR
  }

  fn extract_modifier(&self, square: &u16) -> u16 {
    square & BoardMasks::MODIFIERS
  }

  fn square_to_char(&self, square: &u16) -> String {
    let piece = self.extract_piece(square);
    let colour = self.extract_colour(square);
    let modifier = self.extract_modifier(square);

    let piece_char = piece_to_char(piece);
    
    let output_char = if colour == Pieces::WHITE {
        piece_char.to_uppercase().collect::<String>()
    } else {
        piece_char.to_string()
    };

    let modifier_char = modifier_to_char(modifier);

    format!("{}{}", output_char, modifier_char)
  }
}

// just put these here for now
fn piece_to_char(piece: u16) -> char {
  match piece {
    Pieces::EMPTY => ' ',
    Pieces::PAWN => 'p',
    Pieces::ROOK => 'r',
    Pieces::KNIGHT => 'n',
    Pieces::BISHOP => 'b',
    Pieces::QUEEN => 'q',
    Pieces::KING => 'k',
    Pieces::EN_PASSANT => 'e',
    _ => '?',
  }
}

fn modifier_to_char(modifier: u16) -> char {
  match modifier {
    0 => ' ', // No modifier
    TileModifiers::CLEAR_MODIFIER => '⁰',
    TileModifiers::TRENCH => '¹',
    TileModifiers::PORTAL => '²',
    TileModifiers::REVERSE_PAWN => '³',
    TileModifiers::SHOVE_PAWN => '⁴',
    _ => ' ',
  }
}
