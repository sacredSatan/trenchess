import './App.css'
import Engine from './engine/index';
import { useState } from 'react';
import Board from './Board';

const engine = new Engine();

function App() {
  const [ position, setPosition ] = useState(engine.getPositions());
  return (
    <>
      <Board position={position} setPosition={setPosition} engine={engine} />
    </>
  )
}

export default App
