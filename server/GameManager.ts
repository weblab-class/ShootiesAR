import { Vector3 } from "three";
import Player from "./Player";
import EnemySpawner from "./EnemySpawner";
import { GAME_CLOCK } from "./server-socket";
import PlayerSerialized from "./PlayerSerialized";
import { BehaviorSubject } from "rxjs";
import GameStateSerialized from "./GameStateSerialized";
import EnemySerialized from "./EnemySerialized";

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

    setTimeout(() => {
      this.enemySpawner.startWave();
    }, 0); // 10000
  
    GAME_CLOCK.subscribe(() => {
      this.gameState.next(this.serializeGameState());
      // reset single-cycle events:
      for (const player of this.players.values()) {
        player.fired = false;
      }
    });
  }

  public shoot(playerId: string) {
    const player = this.players.get(playerId);
    if (!player) {
      return;
    }
    player.fired = true;
    // convert player direction euler coordinates to a normalized direction vector
    const pitch = player.rotation.x;
    const yaw = player.rotation.y;
    const dir = new Vector3(
      -Math.sin(yaw)*Math.cos(pitch),
      Math.sin(pitch),
      -Math.cos(yaw)*Math.cos(pitch),
    );
    
    // compute discriminant to check if there is an intersection
    for (const enemy of this.enemySpawner.enemies.value) {
      const P_MINUS_C = player.position.clone().sub(enemy.position);
      const a: number = dir.dot(dir);
      const b: number = 2 * dir.dot(P_MINUS_C);
      const c: number = P_MINUS_C.dot(P_MINUS_C) - enemy.hitboxRadius;
      if (b*b - 4*a*c < 0) {
        continue;
      }
      // todo: make sure enemy is in front of player
      enemy.takeDamage(1);
    }
  }

  public playerUpdate(playerId: string, playerData: PlayerSerialized) {
    const player = this.players.get(playerId);
    if (!player) {
      return;
    }
    player.position.x = playerData.position.x;
    player.position.y = playerData.position.y;
    player.position.z = playerData.position.z;
    player.rotation.x = playerData.rotation.x;
    player.rotation.y = playerData.rotation.y;
    player.rotation.z = playerData.rotation.z;
  }
  
  private serializeGameState(): GameStateSerialized  {
    const playersSerialized: PlayerSerialized[] = [];
    for (const [id, player] of this.players.entries()) {
      playersSerialized.push({
        userId: id,
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
        fired: player.fired,
      });
    }

    const enemiesSerialized: EnemySerialized[] = [];
    for (const [id, enemy] of this.enemySpawner.enemies.value.entries()) {
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