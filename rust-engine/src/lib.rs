// had random bugs with default allocator, not knowledgeable enough to debug right now
// claude + https://github.com/wasm-bindgen/wasm-bindgen/tree/main/examples got me through here
// hopefully by the end of the development I've learned enough rust to go back to the default allocator
// and debug the issues

#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

use wasm_bindgen::prelude::*;
use web_sys::js_sys::Uint16Array;

// Module declarations
mod constants;
mod engine;

pub use engine::Engine;
pub use constants::*;

// WASM bindings for JavaScript
#[wasm_bindgen]
pub struct TrenchessEngine {
  engine: Engine,
}

#[wasm_bindgen]
impl TrenchessEngine {
  #[wasm_bindgen(constructor)]
  pub fn new() -> TrenchessEngine {
    // Set up panic hook for better error messages in browser
    console_error_panic_hook::set_once();
    
    TrenchessEngine {
      engine: Engine::new(),
    }
  }


  #[wasm_bindgen]
  pub fn set_state(&mut self, state: Uint16Array) {
    let vec: Vec<u16> = state.to_vec();
    if vec.len() >= 64 {
      self.engine.state.copy_from_slice(&vec[0..64]);
    }
  }

  #[wasm_bindgen]
  pub fn draw(&self) {
    self.engine.draw();
  }

  #[wasm_bindgen]
  pub fn set_square(&mut self, index: usize, value: u16) {
    if index < 64 {
      self.engine.state[index] = value;
    }
  }
}
