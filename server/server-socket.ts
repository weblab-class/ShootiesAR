import type http from "http";
import { Server, Socket } from "socket.io";
import { BehaviorSubject, combineLatest, filter, interval, map, pairwise } from "rxjs";
import Lobby from "./Lobby";
import PlayerSerialized from "./PlayerSerialized";
import ClientState from "./ClientState";
import UserData from "./UserData";
import LobbySerialized from "./LobbySerialized";

const FPS = 60;
const LOBBY_TTL_SECONDS = 5; // a disconnected player has this amount of time to reconnect before getting kicked from the lobby they were in

let io: Server;

const userIdToUserMap = new Map<string, UserData>(); // maps user ID to UserData object
const codeToLobbyMap = new Map<string, Lobby>(); // maps lobby code to Lobby object

const getClientState = (user: UserData): ClientState => {
  const lobby = user.lobby.value;
  if (!lobby) {
    return ClientState.NOT_IN_LOBBY;
  }
  if (lobby.inGame) {
    return ClientState.IN_GAME;
  }
  return ClientState.IN_LOBBY_NOT_GAME;
}

export const init = (server: http.Server): void => {
  io = new Server(server);
  io.on("connection", (socket: Socket) => {

    //////////////////// Connection //////////////////

    console.log(`socket has connected ${socket.id}`);

    let currentUser: UserData = new UserData("");

    socket.on("setUserId", (userId: string) => {
      const user = userIdToUserMap.get(userId);
      if (user) {
        currentUser = user;
      } else {
        // create new UserData
        currentUser = new UserData(userId);
        userIdToUserMap.set(userId, currentUser);
        
        // whenever user data updates, send that data to frontend
        combineLatest([currentUser.socket, currentUser.lobby])
          .subscribe(() => currentUser.socket.value?.emit("clientState", getClientState(currentUser)));
      }
      if (currentUser.socket.value !== null && currentUser.socket.value !== socket) {
        // there was an old tab open for this user, force it to disconnect
        currentUser.socket.value.disconnect();
      }
      if (currentUser.lobby.value) {
        socket.join(`lobby-${currentUser.lobby.value.code}`);
      }
      if (currentUser.lobby.value) {
        socket.emit("lobbyData", currentUser.lobby.value.getLobbyData());
      }
      currentUser.socket.next(socket);
    });

    socket.on("disconnect", () => {
      currentUser.socket.next(null);
    });
    
    socket.on("disconnecting", () => {
      // kick the player from their lobby iff they are not currently in a game and have not reconnected after LOBBY_TTL seconds
      if (currentUser.lobby.value?.inGame) {
        setTimeout(() => {
          if (currentUser.socket.value === null) {
            currentUser.lobby.value?.leave(currentUser.userId);
          }
        }, LOBBY_TTL_SECONDS);
      }
    });

    ////////////////////// Lobby //////////////////////

    socket.on("createRoom", () => {
      const newLobby = new Lobby();
      codeToLobbyMap.set(newLobby.code, newLobby);
      newLobby.join(currentUser.userId);
      socket.join(`lobby-${newLobby.code}`);
      currentUser.lobby.next(newLobby);

      newLobby.players.subscribe(() => {
        io.to(`lobby-${newLobby.code}`).emit("lobbyData", newLobby.getLobbyData());
      });

      newLobby.gameState.subscribe((gameState) => {
        io.to(`lobby-${newLobby.code}`).emit("clientState", gameState ? ClientState.IN_GAME : ClientState.IN_LOBBY_NOT_GAME)
      })

      GAME_CLOCK.subscribe(() => {
        // if (newLobby.gameState.value) {
        //   for (const player of newLobby.gameState.value?.players) {
        //     console.log(player.userId, player.position.x, player.position.y, player.position.z)
        //   }
        // }
        io.to(`lobby-${newLobby.code}`).emit("gameState", newLobby.gameState.value);
      });
    });

    socket.on("joinRoom", (code: string) => {
      const lobby = codeToLobbyMap.get(code);
      if (!lobby) {
        console.log("that code does not exist");
        return;
      }
      socket.join(`lobby-${lobby.code}`);
      lobby.join(currentUser.userId);
      currentUser.lobby.next(lobby);;
    });

    socket.on("leaveRoom", () => {
      const lobby = currentUser.lobby.value;
      if (!lobby) {
        console.log("can't leave since you're not in a room!");
        return;
      }
      currentUser.lobby.next(null);
      socket.leave(`lobby-${lobby.code}`);
      lobby.leave(currentUser.userId);
    });

    //////////////////// Gameplay /////////////////////

    socket.on("startGame", () => {
      currentUser.lobby.value?.startGame();
    });

    socket.on("shoot", () => {
      currentUser.lobby.value?.gameManager?.shoot(currentUser.userId);
    });

    socket.on("playerUpdate", (playerData: PlayerSerialized) => {
      currentUser.lobby.value?.gameManager?.playerUpdate(currentUser.userId, playerData);
    });

    socket.on("finishGame", () => {
      currentUser.lobby.value?.finishGame();
    })
  });
};

/** ticks at regular intervals and gives the duration since the last tick (in seconds) */
export const GAME_CLOCK = interval(1000 / FPS).pipe(
  map(_ => (new Date()).getTime() / 1000),
  pairwise(),
  map(([prevTime, curTime]) => curTime - prevTime),
);

export default {
  init,
  GAME_CLOCK,
};
