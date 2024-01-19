import { Vector3 } from "three";
import Player from "../gameclasses/Player";
import EnemySpawner from "./EnemySpawner";
import { GAME_CLOCK } from "../sockets/server-socket";
import PlayerSerialized from "../serialized/PlayerSerialized";
import { BehaviorSubject } from "rxjs";
import GameStateSerialized from "../serialized/GameStateSerialized";
import EnemySerialized from "../serialized/EnemySerialized";

export default class GameManager {
  public readonly gameState: BehaviorSubject<GameStateSerialized>;
  public readonly gameOver: BehaviorSubject<boolean>;
  private readonly players: Map<string, Player>;
  private readonly enemySpawner: EnemySpawner;

  constructor(players: string[]) {
    this.enemySpawner = new EnemySpawner();
    this.gameOver = new BehaviorSubject<boolean>(false);

    this.players = new Map<string, Player>();
    for (const playerId of players) {
      this.players.set(playerId, new Player(new Vector3(50*Math.random() - 25, 1.5, 0)));
    }

    this.gameState = new BehaviorSubject<GameStateSerialized>(this.serializeGameState());
  }

  public startGame() {
    setTimeout(() => {
      this.enemySpawner.startWave();
    }, 10000);

    GAME_CLOCK.subscribe(() => {
      this.gameState.next(this.serializeGameState());
    });
  }

  public shoot(player: string) {
    
  }

  public playerUpdate(player: string, playerData: PlayerSerialized) {

  }

  private serializeGameState(): GameStateSerialized  {
    const playersSerialized: PlayerSerialized[] = [];
    for (const [id, player] of this.players.entries()) {
      playersSerialized.push({
        socketId: id,
        position: {
          x: player.position.x,
          y: player.position.y,
          z: player.position.z,
        },
        rotation: {
          x: player.rotation.x,
          y: player.rotation.y,
          z: player.rotation.z,
        },
      });
    }

    const enemiesSerialized: EnemySerialized[] = [];
    for (const [id, enemy] of this.enemySpawner.currentEnemies.entries()) {
      enemiesSerialized.push({
        id: id,
        position: {
          x: enemy.position.x,
          y: enemy.position.y,
          z: enemy.position.z,
        },
      });
    }

    return {
      players: playersSerialized,
      enemies: enemiesSerialized,
    };
  }
}