import { BehaviorSubject } from "rxjs";
import GameManager from "./GameManager";
import GameStateSerialized from "./GameStateSerialized";
import { GAME_CLOCK } from "./server-socket";
import LobbySerialized from "./LobbySerialized";

export default class Lobby {
  public gameManager: GameManager | null;
  
  public readonly code: string; // the code that a user can type in to join this room
  public readonly players: BehaviorSubject<string[]>; // user IDs
  public readonly playersToMultipliers = new Map<string, { health: number, damage: number, healing: number }>();
  public maxPlayers: number; // max number of players allowed in the room
  
  private static lobbyCounter = 0;
  
  public get gameState() { return this.gameManager ? this.gameManager.gameState.value : null };

  public constructor(maxPlayers = 99) {
    this.code = this.generateUniqueLobbyCode();
    this.players = new BehaviorSubject<string[]>([]);
    this.maxPlayers = maxPlayers;
    this.gameManager = null;
  }

  public join(userId: string, stats: { health: number, damage: number, healing: number }) {
    if (this.gameManager) {
      console.log("failed to join lobby");
    } else if (this.players.value.length < this.maxPlayers) {
      this.playersToMultipliers.set(userId, { health: stats.health ?? 1, damage: stats.damage ?? 1, healing: stats.healing ?? 1});
      this.players.next(this.players.value.concat([userId]));
    } else {
      console.log(`Cannot exceed maxPlayer limit of ${this.maxPlayers}`);
    }
  }

  public leave(userId: string) {
    if (this.gameManager) {
      console.log("failed to leave lobby");
    } else if (this.players.value.includes(userId)) {
      this.playersToMultipliers.delete(userId);
      this.players.next(this.players.value.filter(id => id !== userId));
    } else {
      console.log(`UserId ${userId} not found in player list ${this.players}`);
    }
  }

  public startGame() {
    if (this.gameManager) {
      return; // game was already started
    }
    this.gameManager = new GameManager(this.players.value, this.playersToMultipliers);
  }

  public finishGame() {
    // unsubscribe and destroy everything in the current game
    this.gameManager?.finish()
    this.gameManager = null;
  }

  public getLobbyData(): LobbySerialized {
    return { players: this.players.value, code: this.code };
  }

  private generateUniqueLobbyCode(): string {
    let result = '';
    let number = Lobby.lobbyCounter++ + 1;
  
    while (number > 0) {
      // Convert the remainder to a letter
      const remainder = (number - 1) % 26;
      const letter = String.fromCharCode(65 + remainder);
  
      // Prepend the letter to the result
      result = letter + result;
  
      // Update the number to exclude the last digit
      number = Math.floor((number - 1) / 26);
    }

    return result;
  }
}