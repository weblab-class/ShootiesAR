import type http from "http";
import { Server, Socket } from "socket.io";
import User from "../../shared/User";
import { interval, map } from "rxjs";
import GameManager from "../gamelogic/GameManager";
import Lobby from "./Lobby";
import PlayerSerialized from "../serialized/PlayerSerialized";

const FRAME_RATE = 60;

let io: Server;

const userToSocketMap: Map<string, Socket> = new Map<string, Socket>(); // maps user ID to socket object
const socketToUserMap: Map<string, User> = new Map<string, User>(); // maps socket ID to user object
const codeToLobbyMap: Map<string, Lobby> = new Map<string, Lobby>(); // maps lobby code to Lobby object

export const getSocketFromUserID = (userid: string) => userToSocketMap.get(userid);
export const getUserFromSocketID = (socketid: string) => socketToUserMap.get(socketid);
export const getSocketFromSocketID = (socketid: string) => io.sockets.sockets.get(socketid);

export const addUser = (user: User, socket: Socket): void => {
  const oldSocket = userToSocketMap.get(user._id);
  if (oldSocket && oldSocket.id !== socket.id) {
    // there was an old tab open for this user, force it to disconnect
    // TODO(weblab student): is this the behavior you want?
    oldSocket.disconnect();
    socketToUserMap.delete(oldSocket.id);
  }
  userToSocketMap.set(user._id, socket);
  socketToUserMap.set(socket.id, user);
};

export const removeUser = (user: User, socket: Socket): void => {
  if (user) userToSocketMap.delete(user._id);
  socketToUserMap.delete(socket.id);
};

export const GAME_CLOCK = interval(1000 / FRAME_RATE).pipe(map(_ => null));

const getLobby = (socket: Socket): Lobby | null => {
  for (const roomName of socket.rooms.values()) {
    if (roomName.startsWith("lobby-")) {
      return codeToLobbyMap.get(roomName.slice(6))!;
    }
  }
  return null;
}

export const init = (server: http.Server): void => {
  io = new Server(server);
  io.on("connection", (socket) => {

    //////////////////// Connection //////////////////

    console.log(`socket has connected ${socket.id}`);

    
    socket.on("disconnect", () => {
      console.log(`socket has disconnected ${socket.id}`);
      const user = getUserFromSocketID(socket.id);
      if (user !== undefined) removeUser(user, socket);
    });
    
    socket.on("disconnecting", () => {
      getLobby(socket)?.leave(socket.id);
    });

    ////////////////////// Lobby //////////////////////

    socket.on("createRoom", () => {
      const newLobby = new Lobby();
      newLobby.join(socket.id);
      codeToLobbyMap.set(newLobby.code, newLobby);
      socket.join(`lobby-${newLobby.code}`);
    });

    socket.on("joinRoom", (code: string) => {
      const lobby = codeToLobbyMap.get(code);
      if (lobby) {
        lobby.join(socket.id);
        socket.join(`lobby-${lobby.code}`);
      }
    });

    socket.on("leaveRoom", () => {
      const lobby = getLobby(socket);
      if (lobby) {
        lobby.leave(socket.id);
        socket.leave(`lobby-${lobby.code}`);
      }
    });

    //////////////////// Gameplay /////////////////////

    // client to server

    socket.on("startGame", () => {
      getLobby(socket)?.startGame();
    });

    socket.on("shoot", () => {
      getLobby(socket)?.gameManager?.shoot(socket.id);
    });

    socket.on("playerUpdate", (playerData: PlayerSerialized) => {
      getLobby(socket)?.gameManager?.playerUpdate(socket.id, playerData);
    });

    // server to client

    GAME_CLOCK.subscribe(() => {
      const lobby = getLobby(socket);
      if (lobby && lobby.gameManager) {
        io.to(`lobby-${lobby.code}`).emit("gameState", lobby.gameManager.gameState.value);
      }
    });
  });
};

export const getIo = () => io;

export default {
  getIo,
  init,
  removeUser,
  addUser,
  getSocketFromSocketID,
  getUserFromSocketID,
  getSocketFromUserID,
};
