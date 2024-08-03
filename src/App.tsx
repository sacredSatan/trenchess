import './App.css'
import Engine from './engine/index';
import { useEffect, useRef, useState } from 'react';
import Board from './Board';
import { clientConnect, clientInitialize, getDataConnection, hostInitialize, PEER_ID_PREFIX, setupHostConnection } from './p2p';

const engine = new Engine();

function App() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [ position, setPosition ] = useState(engine.getPositions());
  const [ loading, setLoading ] = useState(false);
  const [ peerId, setPeerId ] = useState<string>();
  
  useEffect(() => {
    if(peerId) {
      const connection = getDataConnection();
      if(connection) {
        connection.on("data", (move) => {
          if(engine.move(move as string)) {
            setPosition(engine.getPositions());
          }
        });
      }
    }
  }, [ peerId ]);
  
  if(!peerId) {
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
              setPeerId(peerId); setLoading(false); }).catch((err) => { throw err; });
          }).catch((err) => { throw err; });
        }}}>Join Host</button>
      </>
    );
  }
  
  return (
    <>
      <h6>ID: {peerId.replaceAll(PEER_ID_PREFIX, "")}</h6>
      <Board position={position} setPosition={setPosition} engine={engine} connection={getDataConnection()} />
    </>
  )
}

export default App
