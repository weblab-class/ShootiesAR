// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React from "react";
import { RouteComponentProps } from "@reach/router";
import Scene from "../renders/Scene";

type Props = RouteComponentProps & {
  userId?: string | undefined;
};

const Game = (props: Props) => {
  return (
    <>
      {props.userId 
        ? (<Scene userId={props.userId}/>)
        : (<p>loading...</p>)
      }
    </>
  )
}

export default Game;