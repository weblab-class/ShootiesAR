import { BehaviorSubject } from "rxjs";
import Lobby from "./Lobby";
import { Socket } from "socket.io";

export default class UserData {
  public readonly userId: string;
  public readonly socket = new BehaviorSubject<Socket | null>(null);
  public readonly lobby = new BehaviorSubject<Lobby | null>(null);

  constructor(userId: string) {
    this.userId = userId;
  }
}