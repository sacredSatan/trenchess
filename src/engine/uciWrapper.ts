import * as readline from "node:readline";
import Engine from "./";
const startPosFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
(() => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.on('line', (input) => {
    const engine = new Engine();
    
    if(input.startsWith("position ")) {
      const [positionStr, moves] = input.split(" moves ");
      const fen = positionStr.includes("startpos") ? startPosFen : positionStr.split("position ")[1];
      const startState = engine.fenToState(fen);
      engine.initializeGameWithFullState(startState);
      
    }

    if(input === "uci") {
      console.log("uciok");
    }

    if(input === "ucinewgame") {
      engine.initializeGameWithFullState(engine.fenToState(startPosFen));
    }

    if(input === "isready") {
      console.log("readyok");
    }

    if (input === "quit") {
      console.log("quitting...");
      rl.close();
    }
  });
})();