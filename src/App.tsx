import './App.css'
import Engine from './engine/index';
import { useEffect, useRef, useState } from 'react';
import Board from './Board';
import { clientConnect, clientInitialize, getDataConnection, hostInitialize, PEER_ID_PREFIX, setupHostConnection } from './p2p';

const engine = new Engine();

function App() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [ [ position, moveState, cards ], setPosition ] = useState(engine.getPositions());
  const [ isWhite, setIsWhite ] = useState<boolean | null>(null);
  const [ loading, setLoading ] = useState(false);
  const [ peerId, setPeerId ] = useState<string>();
  const [ debug, setDebug ] = useState(false);
  
  useEffect(() => {
    if(peerId) {
      const connection = getDataConnection();
      if(connection) {
        connection.on("data", (d) => {
          console.log(d, "dat=======");
          // @ts-expect-error not typing d
          if(d?.type === "initial") {
            // @ts-expect-error not typing d
            engine.initializeGame(d.value);
            // @ts-expect-error not typing d
            setIsWhite(!d.value.isWhite);
            setPosition(engine.getPositions())
          } else {
            if(engine.move(d as string) > 1) {
              setPosition(engine.getPositions());
            }
          }
        });
      }
    }
  }, [ peerId ]);
  
  if(!peerId && !debug) {
    return (
      <>
        <input ref={inputRef} type="text" name="peerName" /> <button type="button" disabled={loading} onClick={() => {
          if(inputRef.current && !loading) {
            setLoading(true);
            const peerId = inputRef.current.value;
            hostInitialize(peerId).then(() => { setupHostConnection().then(() => { setPeerId(peerId); setLoading(false); }).catch((err) => { throw err; }) });
        }}}>Host</button>
        <button type="button" disabled={loading} onClick={() => {
          if(inputRef.current && !loading) {
            const peerId = inputRef.current.value;
          setLoading(true);
          clientInitialize().then((peer) => {
            console.log("initialized peer", peer);
            clientConnect(peerId).then(() => {
              setPeerId(peerId); setLoading(false);
              const initialState = engine.initializeGame();
              console.log(initialState, "dat=======");
              getDataConnection()?.send({
                type: "initial",
                value: initialState,
              });
              setIsWhite(initialState.isWhite);
              setPosition(engine.getPositions())
            }).catch((err) => { throw err; });
          }).catch((err) => { throw err; });
        }}}>Join Host</button>
        <button type="button" onClick={() => {
          setDebug(true);
          engine.initializeGame();
          setIsWhite(true);
          setPosition(engine.getPositions())
        }}>SET DEBUG</button>
      </>
    );
  }

  console.log({ cards });
  
  return (
    <>
      <h6>ID: {peerId?.replaceAll(PEER_ID_PREFIX, "")}</h6>
      <h6>LAST MOVE STATE: {moveState}</h6>
      {debug ? <button type="button" onClick={(() => { engine.undoMove(); setPosition(engine.getPositions()) })}>undo move</button> : null}
      {/* @ts-expect-error who cares at this point */}
      <Board isWhite={isWhite} debug={debug} cards={isWhite ? cards.whiteCards : cards.blackCards} position={position} setPosition={setPosition} engine={engine} connection={getDataConnection()} />
    </>
  )
}

export default App
