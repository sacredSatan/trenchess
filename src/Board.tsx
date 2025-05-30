import { gzip } from "pako";
import { useRef, useState, Fragment, useMemo } from 'react';
import Engine, { MOVE_RETURN_VALUES_MAP, MAX_CARDS_IN_HAND } from './engine/index';
import { DataConnection } from 'peerjs';

type BoardProps = {
  isWhite: boolean;
  position: Record<string, string>;
  setPosition: React.Dispatch<React.SetStateAction<unknown>>;
  engine: Engine;
  connection: DataConnection | null;
  cards: string[];
  debugCards: {
    whiteCards: string[];
    blackCards: string[];
    whiteCardDrawCounter: number;
    blackCardDrawCounter: number;
  };
  moveHistory: { type: string; value: string | string[] | number[] }[];
  storedMoveHistory: { type: string; value: string | string[] | number[] }[];
  debug: boolean;
  cardDrawCounter: number;
  replay: boolean;
  disableMoves: boolean;
}

const moveHistoryGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  maxWidth: "400px", 
  minWidth: "300px",
  border: "1px solid #ddd",
  maxHeight: "300px",
  overflowY: "auto" as const,
};

const moveHistoryItem = {
  margin: "10px",
};

const gridStyle = { 
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr",
  gridTemplateRows: "1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr",
  width: "50vw",
  maxWidth: "600px", 
  minWidth: "400px",
  userSelect: "none" as const,
};

const promotionGridStyle = { 
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr",
  gridTemplateRows: "1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr",
  width: "50vw",
  maxWidth: "600px", 
  minWidth: "400px",
  position: "absolute" as const,
  zIndex: 1,
  background: "rgba(0,0,0,0.5)",
};

const drawCardGridStyle = {
  width: "50vw",
  maxWidth: "600px", 
  minWidth: "400px",
  position: "absolute" as const,
  zIndex: 1,
  background: "rgba(0,0,0,0.5)",
  top: 0,
  bottom: 0,
};

const activeButtonStyle = {
  border: "2px solid #fff",
};

const PROMOTION_CHOICES = ["q", "n", "b", "r"];

const MODIFIER_LABEL_MAP = {
  "⁰": "Clear",
  "¹": "Trench",
  "²": "Portal",
  "³": "Reverse Pawn",
  "⁴": "Shove Pawn",
} as Record<string, string>;

const MODIFIER_VALUE_MAP = {
  "⁰" :"-1",
  "¹" :"0",
  "²" :"1",
  "³" :"2",
  "⁴" :"3",
  "⁵" :"4",
} as Record<string, string>;

const MODIFIER_IMAGE_MAP = {
  "¹": "trench.svg",
  "²": "portal.svg",
  "³": "reversepawn.svg",
  "4": "shovepawn.svg",
} as Record<string, string>;

// paddingBottom 100% ensures div is a square
// https://dev.to/tchaflich/a-width-responsive-perfect-square-in-pure-css-3dao
const squareStyle = { paddingBottom: "100%", position: "relative" as const };
const pieceStyle = { position: "absolute" as const, top: 0, bottom: 0, width: "100%", height: "100%" };

const PIECE_CHARS = ["k", "q", "r", "b", "n", "p"].map((c) => [ c.toUpperCase(), c ]).flat();

const Board: React.FC<BoardProps> = (props) => {
  const { position, setPosition, engine, connection, isWhite, cards, moveHistory, debug, cardDrawCounter, replay, storedMoveHistory, debugCards, disableMoves } = props;
  const activePosition = useRef<string>();
  const [ movableSquares, setMovableSquares ] = useState<Set<number>>();
  const [ promotionMove, setPromotionMove ] = useState<string>();
  const [ activeModifier, setActiveModifier ] = useState<string>();
  const [ selectedCards, setSelectedCards ] = useState<number[]>([]);
  const moveIndex = useRef(0);

  const drawCardSelection = useMemo(() => {
    return [ ...cards, ...engine.getRandomCards() ];
  }, [ cards, engine ]);
  console.log(position, "pos");

  console.log(activeModifier, "MOD");

  const containerRef = useRef<HTMLDivElement>(null);
  const isCurrentTurn = isWhite ? engine.getCurrentTurn() === "white" : engine.getCurrentTurn() === "black";
  const modifierMoveName = `ADD_MODIFIER_${debug ? engine.getCurrentTurn().toUpperCase() : isWhite ? "WHITE" : "BLACK"}`;
  let shouldShowCardDraw = false;
  if(debug) {
    shouldShowCardDraw = engine.getCurrentTurn() === "black" ? debugCards.blackCardDrawCounter === 0 : debugCards.whiteCardDrawCounter === 0;
  } else if(replay) {
    shouldShowCardDraw = false;
  } else {
    shouldShowCardDraw = isCurrentTurn && cardDrawCounter === 0;
  }
  
  return <>
    {promotionMove ? (<div style={{...promotionGridStyle}}>
      {new Array(34).fill(undefined).map((_, index) => <div key={index}></div>)}
      {PROMOTION_CHOICES.map((piece) => {
        const isWhite = promotionMove.includes("8");
        const pieceImageName = isWhite ? "w" + piece : "b" + piece;
        return <div key={piece} style={squareStyle} onClick={() => {
          const move = promotionMove + " " + piece;
          const moveValue = engine.move(move);
          if(moveValue > 1) {
            connection?.send(move);
            setPosition(engine.getPositions());
            setMovableSquares(undefined);
            activePosition.current = undefined;
            setPromotionMove(undefined);
          } else {
            alert(MOVE_RETURN_VALUES_MAP[moveValue]);
            setPromotionMove(undefined);
            setMovableSquares(undefined);
            activePosition.current = undefined;
          }
        }}><div style={{ ...pieceStyle, backgroundImage: `url(./pieces/${pieceImageName}.svg)`, backgroundSize: "contain" }}></div></div>;
      })}
    </div>) : null}
    <div style={{ ...gridStyle, transform: `rotate(${isWhite ? "0deg" : "180deg"})`, pointerEvents: (disableMoves || replay) ? "none" : "auto" }} ref={containerRef}>
      {shouldShowCardDraw ? <div style={{...drawCardGridStyle, transform: `rotate(${isWhite ? "0deg" : "180deg"})`}}>
        <span>{`Select cards to keep (max ${MAX_CARDS_IN_HAND})`}</span>
        <div style={{ border: "1px solid #ddd", padding: "10px" }}>
        {drawCardSelection.map((card, index) => {
          return <Fragment key={card+index}>
            <button style={{ margin: "5px 10px", minWidth: "150px", border: "2px solid transparent", ...(selectedCards.includes(index) ? activeButtonStyle : {}) }} onClick={() => setSelectedCards((oldState) => !oldState.includes(index) ? [ ...oldState, index ] : oldState.filter((c) => c !== index))}>{MODIFIER_LABEL_MAP[card]}</button>
            {index % 2 !== 0 ? <br /> : null}
          </Fragment>
        })}
        </div>
        <div>
          <button style={{ margin: "5px 10px", minWidth: "150px", border: "2px solid transparent"}}
            disabled={!((drawCardSelection.length <= MAX_CARDS_IN_HAND && drawCardSelection.length === selectedCards.length) || selectedCards.length === MAX_CARDS_IN_HAND)} onClick={() => {
            console.log("selection", selectedCards.map((index) => drawCardSelection[index]));
            const selectedCardValues = selectedCards.map((index) => drawCardSelection[index]);
            engine.applyCardSelection(selectedCardValues);
            connection?.send({ type: "applyCards", value: JSON.stringify(selectedCardValues) });
            setPosition(engine.getPositions());
            setSelectedCards([]);
          }}>Confirm Selection</button>
        </div>
      </div> : null}
      {new Array(64).fill(undefined).map((_, index) => {
        // index 0 here = a8, index 7 = h8, index 8 = a7
        // need to transform the index number to draw piece in the correct square
        const normalizedIndex = (index % 8) + (8 * (7 - Math.trunc(index / 8)));

        const isMovable = movableSquares?.has(normalizedIndex);

        const positionName = engine.indexToPosition(normalizedIndex);
        const [ , row ] = positionName.split("");
        const rowInt = parseInt(row) - 1;
        const [piece, modifier] = position[positionName] ?? [];
        const modifierImage = MODIFIER_IMAGE_MAP[modifier];

        const _squareStyle = { ...squareStyle, backgroundColor: (index % 2 + rowInt % 2) % 2 ? "#f0d9b5" : "#b58863", opacity: isMovable ? 0.5 : 1, boxShadow: "rgb(0,0,0,0) 0px 0px 0px 0px" };
        const pieceImageName = piece ? piece === piece.toLowerCase() ? "b" + piece : "w" + piece.toLowerCase() : null;
        return <div id={positionName} key={positionName} style={_squareStyle} onClick={() => {
          if(activeModifier) {
            if(PIECE_CHARS.includes(activeModifier)) {
              engine._dangerouslyReplaceSquareValue(positionName, activeModifier);
              setPosition(engine.getPositions());
              setActiveModifier(undefined);
              return;
            }
            const move = `${modifierMoveName} ${positionName} ${activeModifier}`;
            const moveValue = engine.move(move);
            if(moveValue > 1) {
              setActiveModifier(undefined);
              setPosition(engine.getPositions());
              connection?.send(move);
              setPosition(engine.getPositions());
            } else {
              alert(MOVE_RETURN_VALUES_MAP[moveValue]);
            }
            return;
          }

          const [ activePos, activePiece ] = activePosition.current?.split(" ") ?? [];
          if(activePos === positionName) {
            setMovableSquares(undefined);
            activePosition.current = undefined;
          } else {
            if(activePosition.current && isMovable) {
              const move = `${activePos} ${positionName}`;
              if(activePiece === "P" && positionName.endsWith("8") && activePos.endsWith("7") && engine.getCurrentTurn() === "white" || 
              activePiece === "p" && positionName.endsWith("1") && activePos.endsWith("2") && engine.getCurrentTurn() === "black") {
                setPromotionMove(move);
                activePosition.current = undefined;
                return;
              }
              const moveValue = engine.move(move);
              if(moveValue > 1) {
                connection?.send(move);
                setPosition(engine.getPositions());
                setMovableSquares(undefined);
                activePosition.current = undefined;
              } else {
                alert(MOVE_RETURN_VALUES_MAP[moveValue]);
                setMovableSquares(undefined);
                activePosition.current = undefined;
              }
            } else {
              if((piece.toLowerCase() === piece && isWhite) || (piece.toLowerCase() !== piece && !isWhite)) {
                if(!debug) {
                  return;
                }
              } 
              setMovableSquares(engine.getMovableSquares(positionName)[0]);
              setActiveModifier(undefined);
              activePosition.current = `${positionName} ${piece}`;
            }
          }
        }}>
          <div style={{ color: "black", position: "absolute", bottom: 0, left: 0, fontSize: 10, transform: `rotate(${isWhite ? "0deg" : "180deg"})` }}>{positionName}</div>
          {debug ? <div style={{ color: "black", position: "absolute", top: 0, left: 0, fontSize: 10, transform: `rotate(${isWhite ? "0deg" : "180deg"})` }}>{normalizedIndex}</div> : null}
          <div style={{ position: "absolute", bottom: 0, right: 0, fontSize: 10, transform: `rotate(${isWhite ? "0deg" : "180deg"})`, width: 15, height: 15, backgroundImage: `url(./modifiers/${modifierImage})`, backgroundSize: "contain", }}></div>
          {piece ? <div style={{ ...pieceStyle, backgroundImage: `url(./pieces/${pieceImageName}.svg)`, backgroundSize: "contain", transform: `rotate(${isWhite ? "0deg" : "180deg"})` }}></div>: null}
        </div>;
      })}
    </div>
    {(!debug && !replay) ? (<div style={{margin: "10px", padding: "10px", border: "1px solid #ddd", pointerEvents: disableMoves ? "none" : "auto"}}>
      {cards.map((card, index) => {
        return <Fragment key={card+index}>
          <button style={{ margin: "5px 10px", minWidth: "150px", border: "2px solid transparent", ...(activeModifier === MODIFIER_VALUE_MAP[card] ? activeButtonStyle : {}) }} onClick={() => setActiveModifier((oldState) => oldState !== MODIFIER_VALUE_MAP[card] ? MODIFIER_VALUE_MAP[card] : undefined )}>{MODIFIER_LABEL_MAP[card]}</button>
          {index % 2 !== 0 ? <br /> : null}
        </Fragment>
      })}
    </div>) : (
      <div>
        {replay ? <><br/><button style={{ marginRight: "20px" }} onClick={() => {
            let nextIndex = moveIndex.current - 1;
            if(nextIndex < 0) {
              console.log("skipping prev");
              return;
            }
            let move = storedMoveHistory[nextIndex];
            if(move.type === "cardSelection") {
              nextIndex -= 1;
              move = storedMoveHistory[nextIndex];
            }
            engine.undoMove();
            setPosition(engine.getPositions());
            moveIndex.current = nextIndex;
          }}>PREV</button>
          <button onClick={() => {
            const nextIndex = moveIndex.current + 1;
            if(nextIndex >= storedMoveHistory.length) {
              console.log("skipping next");
              return;
            }
            const move = storedMoveHistory[nextIndex];
            if(move.type === "move") {
              engine.move(move.value as string);
            }
            if(move.type === "cardSelection") {
              engine.applyCardSelection(move.value as string[]);
            }
            setPosition(engine.getPositions());
            moveIndex.current = nextIndex;
          }}>NEXT</button>
          <br /></> : null}
        <p>white cards: </p>
        <div style={{margin: "10px", padding: "10px", border: "1px solid #ddd", pointerEvents: replay ? "none" : "auto" }}>
          {debugCards.whiteCards.map((card, index) => {
            return <Fragment key={card+index}>
              <button style={{ margin: "5px 10px", minWidth: "150px", border: "2px solid transparent", ...(activeModifier === MODIFIER_VALUE_MAP[card] ? activeButtonStyle : {}) }} onClick={() => setActiveModifier((oldState) => oldState !== MODIFIER_VALUE_MAP[card] ? MODIFIER_VALUE_MAP[card] : undefined )}>{MODIFIER_LABEL_MAP[card]}</button>
              {index % 2 !== 0 ? <br /> : null}
            </Fragment>
          })}
        </div>
        <p>black cards: </p>
        <div style={{margin: "10px", padding: "10px", border: "1px solid #ddd", pointerEvents: replay ? "none" : "auto" }}>
          {debugCards.blackCards.map((card, index) => {
            return <Fragment key={card+index}>
              <button style={{ margin: "5px 10px", minWidth: "150px", border: "2px solid transparent", ...(activeModifier === MODIFIER_VALUE_MAP[card] ? activeButtonStyle : {}) }} onClick={() => setActiveModifier((oldState) => oldState !== MODIFIER_VALUE_MAP[card] ? MODIFIER_VALUE_MAP[card] : undefined )}>{MODIFIER_LABEL_MAP[card]}</button>
              {index % 2 !== 0 ? <br /> : null}
            </Fragment>
          })}
        </div>
      </div>
    )}
    <p style={{ backgroundColor: "#f0d9b5", color: "#000" }}>Legend: <img style={{position: "relative", top: "2px"}} src="./modifiers/trench.svg"></img> Trench, <img style={{position: "relative", top: "2px"}} src="./modifiers/portal.svg"></img> Portal, <img style={{position: "relative", top: "2px"}} src="./modifiers/reversepawn.svg"></img> Reverse Pawn</p>
    {!replay && <div style={{margin: "10px", padding: "10px", border: "1px solid #ddd"}}>
      Move history
      <br />
      <textarea value={JSON.stringify(moveHistory)} disabled style={{ width: "300px", height: "40px" }} />
      <br />
      {/* https://stackoverflow.com/questions/33643874/gzip-string-in-javascript-using-pako-js */}
      {/* @ts-expect-error for some reason gzip input is erroring out? */}
      <a href={encodeURI(`?moveHistory=${btoa(String.fromCharCode.apply(null, gzip(JSON.stringify(moveHistory))))}`)} style={{color: "#FFF", textDecoration: "underline"}} target="_blank">inspect game for replay</a>
    </div>}
    {debug ? 
      (<div>
      <button style={activeModifier === "-1" ? activeButtonStyle : {}} onClick={() => setActiveModifier((oldState) => !oldState ? "-1" : undefined)}>clear</button>
      <button style={activeModifier === "0" ? activeButtonStyle : {}} onClick={() => setActiveModifier((oldState) => !oldState ? "0" : undefined)}>trench</button>
      <button style={activeModifier === "1" ? activeButtonStyle : {}} onClick={() => setActiveModifier((oldState) => !oldState ? "1" : undefined)}>portal</button>
      <button style={activeModifier === "2" ? activeButtonStyle : {}} onClick={() => setActiveModifier((oldState) => !oldState ? "2" : undefined)}>reverse pawn</button>

        <div>
          {PIECE_CHARS.map((char) => <button key={char} style={activeModifier === char ? activeButtonStyle : {}} onClick={() => setActiveModifier((oldState) => !oldState ? char : undefined)}>{char}</button>)}
          <br />
          <button onClick={() => { engine.resetState(); setPosition(engine.getPositions()) }}>EMPTY BOARD</button>
          <button onClick={() => { engine.resetState(true); setPosition(engine.getPositions()) }}>DEFAULT STATE</button>
          <button onClick={() => { engine.switchTurns(); setPosition(engine.getPositions()) }}>SWITCH TURNS</button>
        </div>
      </div>) : null}
      {replay ? (
        <div>
          <p>Move index: {moveIndex.current}</p>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={moveHistoryGridStyle}>
                {storedMoveHistory.map((history, index) => {
                  if(index === 0) {
                    return <Fragment key={index}></Fragment>
                  }
                  let moveText = "";
                  if(history.type === "move") {
                    if((history.value as string).startsWith("ADD_MODIFIER")) {
                      // console.log("hisva", history.value);
                      const [ , ...rest ] = (history.value as string).split(" ");
                      moveText = rest.join(" mod ");
                    } else {
                      moveText = history.value as string;
                    }
                  }
                  if(history.type === "cardSelection") {
                    moveText = JSON.stringify(history.value);
                  }
                  return <div style={moveHistoryItem}>{`${index}. ${moveText}`}</div>
                })}
            </div>
          </div>
        </div>
      ): null}
      {!replay ? (<button style={{ pointerEvents: disableMoves ? "none" : "auto" }} onClick={() => {
        const move = `RESIGN_${isWhite ? "W" : "B"}`;
        const moveValue = engine.move(move);
        if(moveValue > 1) {
          connection?.send(move);
          setPosition(engine.getPositions());
          setMovableSquares(undefined);
          activePosition.current = undefined;
          setPromotionMove(undefined);
        } else {
          alert(MOVE_RETURN_VALUES_MAP[moveValue]);
        }
      }}>RESIGN</button>) : null}
  </>;
};

export default Board;
