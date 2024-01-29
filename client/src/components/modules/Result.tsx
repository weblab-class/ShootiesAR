import React from "react";
import { GameResult } from "../../../../shared/serialized";
import { socket } from "../../client-socket";

type Props = {
  result: GameResult,
}

const Result = (props: Props) => {
  return (
    <>
      <h1>Game Over</h1>
      <h2>You made it until wave {props.result.wave}</h2>
      <h2>You slayed {props.result.enemiesSlain} enemies</h2>
      <button onClick={() => socket.emit("finishGame")}>Finish</button>
    </>
  )
}

export default Result;