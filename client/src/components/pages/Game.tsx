// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useEffect, useRef, useState } from "react";
import { RouteComponentProps } from "@reach/router";
import Scene from "../modules/Scene";
import { socket } from "../../client-socket";
import { GameStateSerialized } from "../../../../shared/serialized";
import Result from "../modules/Result";

type Props = RouteComponentProps & {
  userId?: string | undefined;
};

const Game = (props: Props) => {
  const [gameOngoing, setGameOngoing] = useState(false);
  const result = useRef(null);

  console.log("re-rendering page (not good)")

  useEffect(() => {
    socket.on("gameState", (gameState: GameStateSerialized) => {
      result.current = gameState.result;
      setGameOngoing(gameState.result === null);
    });
  }, [])

  if (!props.userId) {
    return <p>loading...</p>;
  }

  if (gameOngoing) {
    return <Scene userId={props.userId}/>;
  }

  return (
    <Result result={result}></Result>
  );
}

export default Game;