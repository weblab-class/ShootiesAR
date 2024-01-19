import { BehaviorSubject } from "rxjs";
import GameManager from "../gamelogic/GameManager";
import GameStateSerialized from "../serialized/GameStateSerialized";
import { GAME_CLOCK } from "./server-socket";

export default class Lobby {
  public readonly gameState: BehaviorSubject<GameStateSerialized | null>;

  public readonly code: string; // the code that a user can type in to join this room
  public players: string[]; // socket IDs
  public locked: boolean; // whether players are allowed to join/leave still
  public maxPlayers: number; // max number of players allowed in the room

  private static lobbyCounter = 0;

  public gameManager: GameManager | null;

  public constructor(maxPlayers = 4) {
    this.code = this.generateUniqueLobbyCode();
    this.players = [];
    this.locked = false;
    this.maxPlayers = maxPlayers;
    this.gameManager = null;
    this.gameState = new BehaviorSubject<GameStateSerialized | null>(null);
  }

  public join(socketId: string) {
    if (this.locked) {
      throw new Error("cannot join locked room");
    } else if (this.players.length < this.maxPlayers) {
      this.players.push(socketId);
    } else {
      throw new Error(`Cannot exceed maxPlayer limit of ${this.maxPlayers}`);
    }
  }

  public leave(socketId: string) {
    if (this.locked) {
      throw new Error("cannot leave locked room");
    } else if (this.players.includes(socketId)) {
      this.players = this.players.filter(id => id !== socketId);
    } else {
      throw new Error(`SocketId ${socketId} not found in player list ${this.players}`);
    }
  }

  public startGame() {
    if (this.gameManager) {
      return; // game was already started
    }
    this.locked = true;
    this.gameManager = new GameManager(this.players);
    this.gameManager.gameState.subscribe((update) => {
      this.gameState.next(update);
    });
    this.gameManager.gameOver.subscribe((isGameOver) => {
      if (isGameOver) {
        this.gameState.next(null);
        this.gameManager?.gameState.unsubscribe();
        this.gameManager?.gameOver.unsubscribe();
      }
    })
  }

  private generateUniqueLobbyCode(): string {
    let result = '';
    let number = Lobby.lobbyCounter++ + 1;
  
    while (number > 0) {
      // Convert the remainder to a letter
      let remainder = (number - 1) % 26;
      let letter = String.fromCharCode(65 + remainder);
  
      // Prepend the letter to the result
      result = letter + result;
  
      // Update the number to exclude the last digit
      number = Math.floor((number - 1) / 26);
    }

    return result;
  }
}