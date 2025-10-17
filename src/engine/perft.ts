import Engine from "./index";

// const _engine = new Engine();
const sleep = () => new Promise((resolve) => setTimeout(resolve, 0));
const moveSet = new Set();
export const perft = async (depth: number, _engine?: Engine, callback?: any) => {
  const engine = _engine || new Engine();
  const moves = Array.from(engine.generateLegalMoves()) as string[];
  // console.log(moves);
  const nMoves = moves.length;
  if (depth === 1) {
    return nMoves;
  }

  let nodes = 0;
  for (let i = 0; i < nMoves; i++) {
    // console.log("perft:: depth: ", depth, "move: ", i+1);
    const move = moves[i];
    const res = engine.move(move);
    // if(move === "d8 h4") {
    //   console.log("perft::queen checkmate?");
    // }
    moveSet.add(res);
    if(callback) {
      callback();
      await sleep();
    }
    nodes += await perft(depth - 1, engine, callback);
    engine.undoMove();
    if(callback) {
      callback();
      await sleep();
    }
  }

  return nodes;
}

// const depth = 5;
// const results = {
//   1: 20,
//   2: 400,
//   3: 8902,
//   4: 197281,
//   5: 4865609,
// } as any;

// for(let i = 1; i <= depth; i++) {
//   const t0 = performance.now();
//   console.log(Array.from(moveSet));
//   const perftRes = await perft(i, undefined, null);
//   console.log(i, "found: ", perftRes, "expected: ", results[i], "match: ", perftRes === results[i]);
//   console.log(Array.from(moveSet));
//   moveSet.clear();
//   const t1 = performance.now();
//   console.log("timespent: ", t1 - t0);
// }

