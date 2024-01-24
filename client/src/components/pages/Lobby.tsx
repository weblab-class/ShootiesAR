import React, { useState } from "react";
import { RouteComponentProps } from "@reach/router";
import { socket } from "../../client-socket";
import { LobbySerialized } from "../../../../shared/serialized"

type Props = RouteComponentProps & {
  userId?: string;
};

const Lobby = (props: Props) => {
  const [lobbyData, setLobbyData] = useState<LobbySerialized>();

  socket.on("lobbyData", (data: LobbySerialized) => {
    setLobbyData(data);
  });

  return (
    <>
      <h1>Lobby Code: {lobbyData?.code}</h1>
      <h2>Players in Lobby:</h2>
      <ol>
        {lobbyData?.players.map(player => <p>{player}</p>)}
      </ol>
      <button onClick={() => socket.emit("leaveRoom")}>Leave Lobby</button>
      <button onClick={() => socket.emit("startGame")}>Start Game</button>
    </>
  )
}

export default Lobby;