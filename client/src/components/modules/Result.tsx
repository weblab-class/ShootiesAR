import React, { useEffect, useState } from "react";
import { GameResult } from "../../../../shared/serialized";
import { socket } from "../../client-socket";

type Props = {
  result: GameResult,
  userId?: string | undefined,
  processGameOver: (gameId: number, coins: number) => void;
}

const Result = (props: Props) => {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    props.processGameOver(props.result.id, props.result.wave);

    // slight delay before allowing someone to end game to give other players a chance to load this screen and get their bonus (lol ik this is bad)
    const timeoutId = setTimeout(() => {
      setShowButton(true);
    }, 1000);

    // Clear the timeout if the component unmounts before the timeout completes
    return () => clearTimeout(timeoutId);
  }, []); // Empty dependency array ensures that the effect runs only once after the initial render

  return (
    <>
      <h1>Game Over</h1>
      <h2>You made it until wave {props.result.wave}</h2>
      {props.userId ? <h2>{props.result.wave} coins were added to your account!</h2> : <h2>Sign in to earn coins for completing games.</h2>}
      {showButton && <button onClick={() => socket.emit("finishGame")}>Finish</button>}
    </>
  )
}

export default Result;