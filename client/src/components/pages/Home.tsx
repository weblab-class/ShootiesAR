import React, { useState } from "react";
import {
  GoogleOAuthProvider,
  GoogleLogin,
  googleLogout,
  CredentialResponse,
} from "@react-oauth/google";

import { Link, RouteComponentProps } from "@reach/router";
import { socket } from "../../client-socket";

//TODO(weblab student): REPLACE WITH YOUR OWN CLIENT_ID
const GOOGLE_CLIENT_ID = "654421112195-i5jrfp0t6eun94epmpgejjaa8tv68i1v.apps.googleusercontent.com";

type Props = RouteComponentProps & {
  userId?: string;
  handleLogin: (credentialResponse: CredentialResponse) => void;
  handleLogout: () => void;
};
const Home = (props: Props) => {
  const { handleLogin, handleLogout } = props;
  const [lobbyCodeField, setLobbyCodeField] = useState<string>("");

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <h1>Shooties</h1>
      {props.userId ? (
        <button
          onClick={() => {
            googleLogout();
            handleLogout();
          }}
        >
          Logout
        </button>
      ) : (
        <GoogleLogin onSuccess={handleLogin} onError={() => console.log("Error Logging in")} />
      )}
      <br/>
      <h2>Some notes about this...</h2>
      <ul>
        <li>This is an AR game meant for mobile devices only</li>
        <li>Make sure your browser gives permissions to motion sensor data and the camera</li>
        <li>I haven't programmed any game interaction yet, but as you look around you should see:
          <ul>
            <li>Your teammates nearby (the green cubes)</li>
            <li>A new enemy spawning in every 5 seconds (the red cubes)</li>
          </ul>
        </li>
        <li>There's no way yet to leave the game once started, so play on incognito mode if you don't want to be softlocked lol</li>
        <li>The game is made to be played with or without being signed in</li>
        <li>If signed in, the only difference is you will receive coins for winning games, which you can spend on the shop (not yet implemented)</li>
      </ul>
      <button onClick={() => socket.emit("createRoom")}>Create Lobby</button>
      <p>or...</p>
      <input
        type="text"
        value={lobbyCodeField}
        onChange={(e) => setLobbyCodeField(e.target.value)}
      />
      <button onClick={() => socket.emit("joinRoom", lobbyCodeField)}>Join Lobby</button>
      <br/>
      <Link to="/shop">Shop</Link>
    </GoogleOAuthProvider>
  );
};

export default Home;
