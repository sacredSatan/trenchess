import { useMemo, useRef, useState } from 'react';
import Engine from './engine/index';
import { DataConnection } from 'peerjs';

type BoardProps = {
  isWhite: boolean;
  position: Record<string, string>;
  setPosition: React.Dispatch<React.SetStateAction<unknown>>;
  engine: Engine;
  connection: DataConnection | null;
}

const gridStyle = { 
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr",
  gridTemplateRows: "1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr",
  width: "50vw",
  maxWidth: "600px", 
  minWidth: "400px" 
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

// too tedious to use html5 dnd but the libraries aren't much better, at least at this stage
const dragEndHandler: React.DragEventHandler<HTMLDivElement> = (e) => {
  const pieceSquare = e.target as HTMLDivElement;
  pieceSquare.style.opacity = "1";
  console.log(e, pieceSquare);
};

const hoverShadow = ", rgba(0, 0, 0, 0.5) 0px 0px 10px 2px inset";

const dragEnterHandler: React.DragEventHandler<HTMLDivElement> = (e) => {
  e.preventDefault();
  const position = e.dataTransfer.getData("position");
  const target = e.target as HTMLDivElement;
  console.log(target.dataset.position, position, target.dataset, target.dataset.movable, "enter");
  
  if(target.dataset.position !== position && target.dataset.movable === "true") {
    if(target.dataset.hasPiece) {
      const targetParent = target.parentNode as HTMLDivElement;
      targetParent.style.boxShadow += hoverShadow;
    } else {
      target.style.boxShadow += hoverShadow;
    }
  }
};

const dragLeaveHandler: React.DragEventHandler<HTMLDivElement> = (e) => {
  e.preventDefault();
  const target = e.target as HTMLDivElement;
  if(target.dataset.hasPiece) {
    const targetParent = target.parentNode as HTMLDivElement;
    targetParent.style.boxShadow += targetParent.style.boxShadow.replaceAll(hoverShadow, "");
  } else {
    target.style.boxShadow = target.style.boxShadow.replaceAll(hoverShadow, "");
  }
};

const PROMOTION_CHOICES = ["q", "n", "b", "r"];

// paddingBottom 100% ensures div is a square
// https://dev.to/tchaflich/a-width-responsive-perfect-square-in-pure-css-3dao
const squareStyle = { paddingBottom: "100%", position: "relative" as const };
const pieceStyle = { position: "absolute" as const, top: 0, bottom: 0, width: "100%", height: "100%" };

const Board: React.FC<BoardProps> = (props) => {
  const { position, setPosition, engine, connection, isWhite } = props;
  const activePosition = useRef<string>();
  const [ movableSquares, setMovableSquares ] = useState<Set<number>>();
  const [ promotionMove, setPromotionMove ] = useState<string>();

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartHandler = useMemo(() => {
    const dragStartHandler: React.DragEventHandler<HTMLDivElement> = (e) => {
      const pieceSquare = e.target as HTMLDivElement;
      pieceSquare.style.opacity = "0.5";
      e.dataTransfer.setData("piece", pieceSquare.dataset.piece ?? "");
      e.dataTransfer.setData("position", pieceSquare.dataset.position ?? "");
      setMovableSquares(engine.getMovableSquares(pieceSquare.dataset.position ?? "")[0]);
      console.log(e, pieceSquare);
    };
    return dragStartHandler;
  }, [engine])
  
  const dropHandler = useMemo(() => {
    const dropHandler: React.DragEventHandler<HTMLDivElement> = (e) => {
      console.log(e);
      const fromPosition = e.dataTransfer.getData("position");
      const piece = e.dataTransfer.getData("piece");
      const target = e.target as HTMLDivElement;
      const toPosition = target.dataset.position ?? "";
      const move = `${fromPosition} ${toPosition}`;
      if(piece === "P" && toPosition.endsWith("8") && fromPosition.endsWith("7") && engine.getCurrentTurn() === "white" || 
      piece === "p" && toPosition.endsWith("1") && fromPosition.endsWith("2") && engine.getCurrentTurn() === "black") {
        target.style.boxShadow = target.style.boxShadow.replaceAll(hoverShadow, "");
        setPromotionMove(move);
        return;
      }
      if(engine.move(move) > 1) {
        connection?.send(move);
      }
      setPosition(engine.getPositions());
      setMovableSquares(new Set());
      target.style.boxShadow = target.style.boxShadow.replaceAll(hoverShadow, "");
    };

    return dropHandler;
  }, [connection, engine, setPosition]);
  
  return <>
    {promotionMove ? (<div style={{...promotionGridStyle}}>
      {new Array(34).fill(undefined).map((_, index) => <div key={index}></div>)}
      {PROMOTION_CHOICES.map((piece) => {
        const isWhite = promotionMove.includes("8");
        const pieceImageName = isWhite ? "w" + piece : "b" + piece;
        return <div key={piece} style={squareStyle} onClick={() => {
          const move = promotionMove + " " + piece;
          if(engine.move(move) > 1) {
            connection?.send(move);
            setPosition(engine.getPositions());
            setMovableSquares(undefined);
            activePosition.current = undefined;
            setPromotionMove(undefined);
          }
        }}><div style={{ ...pieceStyle, backgroundImage: `url(./pieces/${pieceImageName}.svg)`, backgroundSize: "contain" }}></div></div>;
      })}
    </div>) : null}
    <div style={{ ...gridStyle, transform: `rotate(${isWhite ? "0deg" : "180deg"})` }} ref={containerRef} onDragStart={dragStartHandler} onDragEnd={dragEndHandler} onDrop={dropHandler} onDragOver={(e) => e.preventDefault()}>
      {new Array(64).fill(undefined).map((_, index) => {
        // index 0 here = a8, index 7 = h8, index 8 = a7
        // need to transform the index number to draw piece in the correct square
        const normalizedIndex = (index % 8) + (8 * (7 - Math.trunc(index / 8)));

        const isMovable = movableSquares?.has(normalizedIndex);

        const positionName = engine.indexToPosition(normalizedIndex);
        const [ , row ] = positionName.split("");
        const rowInt = parseInt(row) - 1;
        const [piece, modifier] = position[positionName] ?? [];
        console.log(piece, modifier, positionName);

        const _squareStyle = { ...squareStyle, backgroundColor: (index % 2 + rowInt % 2) % 2 ? "#f0d9b5" : "#b58863", opacity: isMovable ? 0.5 : 1, boxShadow: "rgb(0,0,0,0) 0px 0px 0px 0px" };
        const pieceImageName = piece ? piece === piece.toLowerCase() ? "b" + piece : "w" + piece.toLowerCase() : null;
        return <div onDragEnter={dragEnterHandler} data-movable={isMovable} onDragLeave={dragLeaveHandler} id={positionName} data-index={normalizedIndex} key={positionName} data-position={positionName} style={_squareStyle} onClick={() => {
          console.log(activePosition.current);
          const [ activePos, activePiece ] = activePosition.current?.split(" ") ?? [];
          if(activePos === positionName) {
            activePosition.current = undefined;
          } else {
            if(activePosition.current) {
              const move = `${activePos} ${positionName}`;
              if(activePiece === "P" && positionName.endsWith("8") && activePos.endsWith("7") && engine.getCurrentTurn() === "white" || 
              activePiece === "p" && positionName.endsWith("1") && activePos.endsWith("2") && engine.getCurrentTurn() === "black") {
                setPromotionMove(move);
                activePosition.current = undefined;
                return;
              }
              if(engine.move(move) > 1) {
                connection?.send(move);
                setPosition(engine.getPositions());
                setMovableSquares(undefined);
                activePosition.current = undefined;
              } else {
                setMovableSquares(engine.getMovableSquares(positionName)[0]);
                activePosition.current = `${positionName} ${piece}`;
              }
            } else {
              setMovableSquares(engine.getMovableSquares(positionName)[0]);
              activePosition.current = `${positionName} ${piece}`;
            }
          }
        }}>
          <div style={{ color: "black", position: "absolute", bottom: 0, left: 0, fontSize: 10, transform: `rotate(${isWhite ? "0deg" : "180deg"})` }}>{positionName}{modifier}</div>
          {piece ? <div data-position={positionName} data-piece={piece} data-has-piece={true} data-movable={isMovable} draggable={true} style={{ ...pieceStyle, backgroundImage: `url(./pieces/${pieceImageName}.svg)`, backgroundSize: "contain", transform: `rotate(${isWhite ? "0deg" : "180deg"})` }}></div>: null}
        </div>;
      })}
    </div>
  </>;
};

export default Board;
