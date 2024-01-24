import React, { useState, useEffect } from "react";
import { Router, useNavigate } from "@reach/router";
import jwt_decode from "jwt-decode";
import { CredentialResponse } from "@react-oauth/google";

import { get, post } from "../utilities";
import NotFound from "./pages/NotFound";
import Home from "./pages/Home";
import Game from "./pages/Game";
import { socket } from "../client-socket";
import User from "../../../shared/User";
import "../utilities.css";
import ClientState from "../../../server/ClientState";
import Lobby from "./pages/Lobby";
import Shop from "./pages/Shop";

const App = () => {
  const [loggedIn, setLoggedIn] = useState<boolean | undefined>(undefined); // undefined = still awaiting promise
  const [googleUserId, setGoogleUserId] = useState<string | undefined>(undefined);
  const [storageUserId, setStorageUserId] = useState<string | undefined>(localStorage.getItem("id") ?? undefined);
  const [trueUserId, setTrueUserId] = useState<string | undefined>(undefined); // the actual user id that the socket uses (combining storage data and google login)
  const [socketConnected, setSocketConnected] = useState<boolean>(false);

  const [clientState, setClientState] = useState<ClientState>(ClientState.UNKNOWN); // determines the page that should be loaded

  const [coins, setCoins] = useState<number>(0);

  useEffect(() => console.log("re-rendering page"))

  // page first load
  useEffect(() => {
    get("/api/whoami")
      .then((user: User) => {
        setGoogleUserId(user._id ? user._id : undefined);
        setLoggedIn(!!user._id);
      });

    addCoins(0); // get coin count
  }, []);

  socket.on("connect", () => setSocketConnected(true));
  socket.on("clientState", (cs: ClientState) => setClientState(cs));

  useEffect(() => {
    if (storageUserId) {
      localStorage.setItem("id", storageUserId);
    }
  }, [storageUserId])

  useEffect(() => {
    // get appropriate id
    if (loggedIn === undefined) {
      setTrueUserId(undefined);
      return;
    }
    if (loggedIn) {
      setTrueUserId(googleUserId);
      return;
    }
    if (storageUserId) {
      setTrueUserId(storageUserId);
      return;
    }
    const newStorageId = crypto.randomUUID();
    setStorageUserId(newStorageId);
  }, [loggedIn, googleUserId, storageUserId]);

  useEffect(() => {
    if (socketConnected && trueUserId) {
      socket.emit("setUserId", trueUserId);
    }
  }, [socketConnected, trueUserId]);

  const handleLogin = (credentialResponse: CredentialResponse) => {
    const userToken = credentialResponse.credential;
    const decodedCredential = jwt_decode(userToken as string) as { name: string; email: string };
    setLoggedIn(true);
    console.log(`Logged in as ${decodedCredential.name}`);
    post("/api/login", { token: userToken }).then((user) => {
      setGoogleUserId(user._id);
      socket.emit("setUserId", googleUserId);
    });
  };

  const handleLogout = () => {
    setGoogleUserId(undefined);
    setLoggedIn(false);
    post("/api/logout");
  };

  const setDifferentPath = (pathname: string) => {
    if (window.location.pathname !== pathname) {
      window.location.replace(pathname);
    }
  };

  useEffect(() => {
    switch (clientState) {
      case ClientState.IN_GAME:
        setDifferentPath("/game");
        break;
      case ClientState.IN_LOBBY_NOT_GAME:
        setDifferentPath("/lobby");
        break;
      case ClientState.NOT_IN_LOBBY:
        if (["/game", "/lobby"].includes(window.location.pathname)) {
          window.location.replace("/");
        }
        break;
      case ClientState.UNKNOWN:
        // todo: display loading screen
        break;
    }
  });

  const addCoins = (coins: number) => {
    post("/api/giveCoins", {coins}).then((user) => {
      setCoins(user.coins);
    });
  }

  // NOTE:
  // All the pages need to have the props extended via RouteComponentProps for @reach/router to work properly. Please use the Skeleton as an example.
  return (
    <Router>
      <Home path="/" handleLogin={handleLogin} handleLogout={handleLogout} userId={googleUserId} />
      <Lobby path="/lobby" userId={trueUserId} />
      <Game path="/game" userId={trueUserId} />
      <Shop path="/shop" userId={googleUserId} coins={coins} addCoins={addCoins} />
      <NotFound default={true} />
    </Router>
  );
};

export default App;
