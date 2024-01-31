import React, { useState, useEffect, useRef } from "react";
import { Router, useNavigate } from "@reach/router";
import jwt_decode from "jwt-decode";
import { CredentialResponse } from "@react-oauth/google";

import { get, post } from "../utilities";
import NotFound from "./pages/NotFound";
import Home from "./pages/Home";
import Game from "./pages/Game";
import About from "./pages/About";
import { socket } from "../client-socket";
import User from "../../../shared/User";
import "../utilities.css";
import ClientState from "../../../server/ClientState";
import Lobby from "./pages/Lobby";
import Shop from "./pages/Shop";

const App = () => {
  const [loggedIn, setLoggedIn] = useState<boolean | undefined>(undefined); // undefined = still awaiting promise
  const [googleUserId, setGoogleUserId] = useState<string | undefined>(undefined);
  const [storageUserId, setStorageUserId] = useState<string | undefined>(localStorage.getItem("id") ?? undefined); // the actual ID used for socket stuff
  const [socketConnected, setSocketConnected] = useState<boolean>(false);

  const [clientState, setClientState] = useState<ClientState>(ClientState.UNKNOWN); // determines the page that should be loaded

  const [coins, setCoins] = useState<number>(0);
  const [health, setHealth] = useState<number>(1);
  const [damage, setDamage] = useState<number>(1);
  const [healing, setHealing] = useState<number>(1);

  // page first load
  useEffect(() => {
    get("/api/whoami")
      .then((user: User) => {
        setGoogleUserId(user._id ? user._id : undefined);
        setLoggedIn(!!user._id);
        if (!!user._id) {
          addCoins(0); // get coin count
        }
      });
  }, []);

  socket.on("connect", () => setSocketConnected(true));
  socket.on("clientState", (cs: ClientState) => setClientState(cs));

  useEffect(() => {
    if (!storageUserId) {
      const newStorageId = crypto.randomUUID();
      localStorage.setItem("id", newStorageId);
      setStorageUserId(newStorageId);
    }
  }, []);

  useEffect(() => {
    if (socketConnected) {
      socket.emit("setUserId", storageUserId);
    }
  }, [socketConnected]);

  const handleLogin = (credentialResponse: CredentialResponse) => {
    const userToken = credentialResponse.credential;
    const decodedCredential = jwt_decode(userToken as string) as { name: string; email: string };
    setLoggedIn(true);
    console.log(`Logged in as ${decodedCredential.name}`);
    post("/api/login", { token: userToken }).then((user) => {
      setGoogleUserId(user._id);
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
      case ClientState.UNKNOWN:
        // todo: display loading screen
        break;
      case ClientState.NOT_IN_LOBBY:
        if (["/game", "/lobby"].includes(window.location.pathname)) {
          window.location.replace("/");
        }
        break;
      case ClientState.IN_LOBBY:
        // we will handle this separately (by reading the gameState value)
        break;
    }
  }, [clientState]);

  const [page, setPage] = useState("");

  useEffect(() => {
    const beOnCorrectPage = (gameState) => {
      if (gameState) {
        setPage("/game");
      } else {
        setPage("/lobby")
      }
    };
    socket.on("gameState", beOnCorrectPage);
    return () => void socket.off("gameState", beOnCorrectPage);
  }, [])

  useEffect(() => {
    if (page === "/game") {
      setDifferentPath("/game")
    }
    if (page === "/lobby") {
      setDifferentPath("/lobby");
    }
    // otherwise do nothing
  }, [page])

  const addCoins = (coins: number) => {
    post("/api/giveCoins", {coins}).then((user) => {
      setCoins(user?.coins ?? 0);
      setHealth(user?.health ?? 1);
      setDamage(user?.damage ?? 1);
      setHealing(user?.healing ?? 1);
    });
  };

  const purchaseUpgrade = (upgrade: "health" | "damage" | "healing") => {
    post("/api/upgrade", {upgrade}).then((user) => {
      setCoins(user?.coins ?? 0);
      setHealth(user?.health ?? 1);
      setDamage(user?.damage ?? 1);
      setHealing(user?.healing ?? 1);
    });
  };

  const processGameOver = (gameId: number, coins: number) => {
    post("/api/gameover", {gameId, coins}).then((user) => {
      setCoins(user?.coins ?? 0);
    })
  }

  // NOTE:
  // All the pages need to have the props extended via RouteComponentProps for @reach/router to work properly. Please use the Skeleton as an example.
  return (
    <Router>
      <Home path="/" handleLogin={handleLogin} handleLogout={handleLogout} userId={googleUserId} />
      <Lobby path="/lobby" userId={storageUserId} />
      <Game path="/game" userId={storageUserId} googleUserId={googleUserId} processGameOver={processGameOver} />
      <About path="/about" />
      <Shop path="/shop" userId={googleUserId} addCoins={addCoins} purchaseUpgrade={purchaseUpgrade} coins={coins} health={health} damage={damage} healing={healing} />
      <NotFound default={true} />
    </Router>
  );
};

export default App;
