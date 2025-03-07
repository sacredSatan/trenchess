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
  const [ debug, setDebug ] = useState(false);
  const [ peerId, setPeerId ] = useState<string>();
  const isHost = useRef<boolean>();

  const [ , urlPeerId ] = location.search.split("?join=");
  console.log({urlPeerId, split: location.search.split("?join=")});
  if(location.search) {
    sessionStorage.setItem("__trenchessTmpGameId", urlPeerId);
    location.search = "";
  }

  const resetGame = () => {
    engine.resetState();
    setPosition(engine.getPositions());
    setIsWhite(null);
    setLoading(false);
    setDebug(false);
    setPeerId("");
  };
  
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
            setPosition(engine.getPositions());
            // @ts-expect-error not typing d
          } else if (d.type === "applyCards") {
            // @ts-expect-error not typing d
            engine.applyCardSelection(JSON.parse(d.value));
          } else {
            if(engine.move(d as string) > 1) {
              setPosition(engine.getPositions());
            }
          }
        });

        connection.on("close", () => {
          if(isHost.current) {
            alert("connection closed,  maybe peer left.");
          } else {
            alert("connection closed, host left or likely has a client already connected to it.");
          }
          resetGame();
        });
      }
    }
  }, [ peerId ]);

  const joinHandler = (peerId: string) => {
    console.log("joinehandler");
    setLoading(true);
    sessionStorage.removeItem("__trenchessTmpGameId");
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
        setPosition(engine.getPositions());
      }).catch((err) => { throw err; });
    }).catch((err) => { throw err; });
  };

  useEffect(() => {
    const tmpGameId = sessionStorage.getItem("__trenchessTmpGameId");
    if(tmpGameId) {
      joinHandler(tmpGameId);
    }
  }, []);
  
  if(!peerId && !debug) {
    return (
      <>
        <div style={{ opacity: 0.9 }}>
          <img src="./logo/pawn.svg" width="200" height="200" style={{marginRight: "-129px", marginBottom: "-4px"}} />
          <img src="./logo/spade.svg" width="150" height="150" />
        </div>
        <div>
        <p>Enter a common passphrase between two players, one to host and the other to join.</p>
        <p>(You can try it out by hosting and joining on separate tabs)</p>
        </div>
        <div>
          <input style={{padding: "10px"}} ref={inputRef} placeholder="Enter a passpharse" type="text" name="peerName" disabled={loading} />
        </div>
        <div>
          {(loading && isHost.current) ? <p>Share this link with 2nd player, or try it out yourself in a new tab: <a href={`${location.origin}${location.pathname}?join=${inputRef.current?.value}`} style={{color: "#FFF", textDecoration: "underline"}} target="_blank">{`${location.origin}${location.pathname}?join=${inputRef.current?.value}`}</a></p> : null}
        </div>
        <div style={{marginTop: "10px"}}>
          <button type="button" disabled={loading} style={{pointerEvents: loading ? "none" : "auto"}} onClick={() => {
            if(inputRef.current && !loading) {
              setLoading(true);
              isHost.current = true;
              const peerId = inputRef.current.value;
              hostInitialize(peerId).then(() => { setupHostConnection().then(() => { setPeerId(peerId); setLoading(false); }).catch((err) => { throw err; }) });
          }}}>{loading ? "Waiting for other player..." : "Host Game"}</button>
          <button type="button" disabled={loading} style={{ marginLeft: "10px", pointerEvents: loading ? "none" : "auto" }} onClick={() => {
            if(inputRef.current && !loading) {
              const peerId = inputRef.current.value;
              isHost.current = false;
              joinHandler(peerId);
          }}}>{loading ? "Waiting for other player..." : "Join Game"}</button>
        </div>
        <div style={{marginTop: "10px"}}>
          <a href="https://github.com/sacredSatan/trenchess?tab=readme-ov-file#gameplay-loop" style={{color: "#FFF", textDecoration: "underline"}} target="_blank">How to play? (see the Gameplay Loop section)</a>
        </div>
        <div style={{"marginTop": "80px"}}>
          <a style={{ color: "rgba(255,255,255,0.1)" }} role="button" onClick={() => {
            setDebug(true);
            engine.initializeGame();
            setIsWhite(true);
            setPosition(engine.getPositions())
          }}>SET DEBUG</a>
        </div>
      </>
    );
  }

  console.log({ cards });
  
  return (
    <>
      <p>Game ID: {peerId?.replaceAll(PEER_ID_PREFIX, "")}</p>
      <p>{new Set(["CHECKMATE", "STALEMATE", "REPEATDRAW"]).has(moveState.lastMoveState) ? <b>{moveState.lastMoveState}</b> : <>Current Turn: <b>{moveState.currentTurn}</b></>}</p>
      <p>Moves till card draw: {isWhite ? cards.whiteCardDrawCounter : cards.blackCardDrawCounter}</p>
      {debug ? <button type="button" onClick={(() => { engine.undoMove(); setPosition(engine.getPositions()) })}>undo move</button> : null}
      {debug ? <p>Debug mode is to mainly setup and try out positions, it might be broken.</p> : null}
      {/* @ts-expect-error who cares at this point */}
      <Board isWhite={isWhite} debug={debug} cardDrawCounter={isWhite ? cards.whiteCardDrawCounter : cards.blackCardDrawCounter} cards={isWhite ? cards.whiteCards : cards.blackCards} position={position} setPosition={setPosition} engine={engine} connection={getDataConnection()} />
    </>
  )
}

export default App
