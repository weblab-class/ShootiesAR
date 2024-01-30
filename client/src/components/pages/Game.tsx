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
  const [gameOngoing, setGameOngoing] = useState(true);
  const result = useRef(null);

  useEffect(() => {
    const getGameResult = (gameState: GameStateSerialized) => {
      if (!gameState) {
        return; // App should be exiting us out of this page any moment now...
      }
      result.current = gameState.result;
      setGameOngoing(gameState.result === null);
    };
    socket.on("gameState", getGameResult);
    return () => socket.off("gameState", getGameResult);
  }, [])

  if (!props.userId) {
    return <p>loading...</p>;
  }

  if (gameOngoing) {
    return <Scene userId={props.userId}/>;
  }

  return (
    <Result result={result.current}></Result>
  );
}

export default Game;