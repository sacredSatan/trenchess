import { useMemo, useRef } from 'react';
import Engine from './engine/index';

type BoardProps = {
  position: Record<string, string>;
  setPosition: React.Dispatch<React.SetStateAction<string>>;
  engine: Engine;
}

const gridStyle = { 
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr",
  gridTemplateRows: "1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr",
  width: "50vw",
  maxWidth: "600px", 
  minWidth: "400px" 
};

// too tedious to use html5 dnd but the libraries aren't much better, at least at this stage
const dragStartHandler: React.DragEventHandler<HTMLDivElement> = (e) => {
  const pieceSquare = e.target as HTMLDivElement;
  pieceSquare.style.opacity = "0.5";
  e.dataTransfer.setData("position", pieceSquare.dataset.position ?? "");
  console.log(e, pieceSquare);
};

const dragEndHandler: React.DragEventHandler<HTMLDivElement> = (e) => {
  const pieceSquare = e.target as HTMLDivElement;
  pieceSquare.style.opacity = "1";
  console.log(e, pieceSquare);
};


const dragEnterHandler: React.DragEventHandler<HTMLDivElement> = (e) => {
  e.preventDefault();
  const position = e.dataTransfer.getData("position");
  const target = e.target as HTMLDivElement;
  console.log(target.dataset.position, position, "enter");
  
  if(target.dataset.position !== position) {
    target.style.boxShadow = "rgba(0,0,0,0.5) 0px 0px 10px 2px inset";
  }
};

const dragLeaveHandler: React.DragEventHandler<HTMLDivElement> = (e) => {
  e.preventDefault();
  const target = e.target as HTMLDivElement;
  target.style.boxShadow = "none";
};

// paddingBottom 100% ensures div is a square
// https://dev.to/tchaflich/a-width-responsive-perfect-square-in-pure-css-3dao
const squareStyle = { paddingBottom: "100%", position: "relative" as const };
const pieceStyle = { position: "absolute" as const, top: 0, bottom: 0, width: "100%", height: "100%" };

const Board: React.FC<BoardProps> = (props) => {
  const { position, setPosition, engine } = props;
  
  const containerRef = useRef<HTMLDivElement>(null);
  const dropHandler = useMemo(() => {
    console.log("is this remomeoings?");
    const dropHandler: React.DragEventHandler<HTMLDivElement> = (e) => {
      console.log(e);
      const fromPosition = e.dataTransfer.getData("position");
      const target = e.target as HTMLDivElement;
      const toPosition = target.dataset.position;
      engine.move(`${fromPosition} ${toPosition}`);
      setPosition(engine.getPositions());
      target.style.boxShadow = "none";
    };

    return dropHandler;
  }, [engine, setPosition]);
  
  return <div style={gridStyle} ref={containerRef} onDragStart={dragStartHandler} onDragEnd={dragEndHandler} onDrop={dropHandler} onDragOver={(e) => e.preventDefault()}>
    {new Array(64).fill(undefined).map((_, index) => {
      // index 0 here = a8, index 7 = h8, index 8 = a7
      // need to transform the index number to draw piece in the correct square
      const normalizedIndex = (index % 8) + (8 * (7 - Math.trunc(index / 8)));

      const positionName = engine.indexToPosition(normalizedIndex);
      const [ , row ] = positionName.split("");
      const rowInt = parseInt(row) - 1;
      const piece = position[positionName];
      const pieceImageName = piece ? piece === piece.toLowerCase() ? "b" + piece : "w" + piece.toLowerCase() : null;
      return <div onDragEnter={dragEnterHandler} onDragLeave={dragLeaveHandler} id={positionName} key={positionName} data-position={positionName} style={{ ...squareStyle, backgroundColor: (index % 2 + rowInt % 2) % 2 ? "#f0d9b5" : "#b58863", }}>
        {piece ? <div data-position={positionName} draggable={true} style={{ ...pieceStyle, backgroundImage: `url(./pieces/${pieceImageName}.svg)`, backgroundSize: "contain" }}></div>: null}
      </div>;
    })}
  </div>;
};

export default Board;
