import React, { useState } from "react";
import {
  GoogleOAuthProvider,
  GoogleLogin,
  googleLogout,
  CredentialResponse,
} from "@react-oauth/google";
import "./Home.css";
import { Link, RouteComponentProps } from "@reach/router";
import { socket } from "../../client-socket";

//TODO(weblab student): REPLACE WITH YOUR OWN CLIENT_ID
const GOOGLE_CLIENT_ID = "654421112195-i5jrfp0t6eun94epmpgejjaa8tv68i1v.apps.googleusercontent.com";

type Props = RouteComponentProps & {
  userId?: string;
  handleLogin: (credentialResponse: CredentialResponse) => void;
  handleLogout: () => void;
  health: number;
  damage: number;
  healing: number;
};
const Home = (props: Props) => {
  const { handleLogin, handleLogout } = props;
  const [lobbyCodeField, setLobbyCodeField] = useState<string>("");

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div id="parent">
        <h1 id="div1">Shooties</h1>
        <div id="div2">
          <button onClick={() => socket.emit("createRoom", { health: props.health, damage: props.damage, healing: props.healing })}>Create Lobby</button>
        </div>
        <div id="div3">
          <input
            type="text"
            value={lobbyCodeField}
            placeholder="Enter Lobby Code..."
            onChange={(e) => setLobbyCodeField(e.target.value)}
          />
        </div>
        <div id="div4">
          <button onClick={() => socket.emit("joinRoom", lobbyCodeField, { health: props.health, damage: props.damage, healing: props.healing })}>Join</button>
        </div>
        <div id="div5">
          <button onClick={() => window.location.replace("/about")}>About</button>
        </div>
        <div id="div6">
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
            <button>
              <GoogleLogin onSuccess={handleLogin} onError={() => console.log("Error Logging in")} />
            </button>
          )}
        </div>
        <div id="div7">
          <button onClick={() => window.location.replace("/shop")}>Shop</button>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default Home;
