import { Vector3 } from "three";
import Player from "./Player";
import HazardSpawner from "./HazardSpawner";
import { GAME_CLOCK } from "./server-socket";
import PlayerSerialized from "./PlayerSerialized";
import { BehaviorSubject, Subscription } from "rxjs";
import GameStateSerialized from "./GameStateSerialized";
import EnemySerialized from "./EnemySerialized";
import ProjectileSerialized from "./ProjectileSerialized";
import Hazard from "./Hazard";
import GameResult from "./GameResult";

export default class GameManager {
  public readonly gameState: BehaviorSubject<GameStateSerialized>;
  public readonly gameOver: BehaviorSubject<boolean>;
  public readonly players: Map<string, Player>;
  private result: GameResult | null;
  private readonly hazardSpawner: HazardSpawner;
  private readonly subscriptions: Subscription[];

  constructor(players: string[]) {
    this.hazardSpawner = new HazardSpawner(this);
    this.gameOver = new BehaviorSubject<boolean>(false);
    this.result = null;
    this.subscriptions = [];

    this.players = new Map<string, Player>();
    for (const playerId of players) {
      this.players.set(playerId, new Player(new Vector3(20 - 40*Math.random(), 1.5, 0)));
    }

    this.gameState = new BehaviorSubject<GameStateSerialized>(this.serializeGameState());

    setTimeout(() => {
      this.hazardSpawner.startWave();
    }, 0); // 10000
  
    // check for collisions between projectiles and player
    this.subscriptions.push(GAME_CLOCK.subscribe(() => {
      for (const player of this.players.values()) {
        for (const projectile of this.hazardSpawner.projectiles.value) {
          if (projectile.position.distanceTo(player.position) < projectile.hurtboxRadius) {
            player.health.next(player.health.value - projectile.damage);
            projectile.destroy()
          }
        }
      }
    }));

    for (const player of this.players.values()) {
      this.subscriptions.push(player.health.subscribe((hp) => {
        if (hp <= 0 && this.result === null) {
          this.result = {
            wave: 69,
            enemiesSlain: 420,
          }
        }
      }));
    }

    this.subscriptions.push(GAME_CLOCK.subscribe(() => {
      this.gameState.next(this.serializeGameState());
      // reset single-cycle events:
      for (const player of this.players.values()) {
        player.fired = false;
      }
    }));
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
    
    // compute discriminant to check if there is a collision with any hazard
    const hazards: Hazard[] = this.hazardSpawner.allHazards;
    let closestHazard: { hazard: Hazard | undefined, distance: number } = { hazard: undefined, distance: Number.MAX_VALUE };
    for (const hazard of hazards) {
      const P_MINUS_C = player.position.clone().sub(hazard.position);
      const distance = P_MINUS_C.length()
      if (distance >= closestHazard.distance) {
        continue;
      }
      const a: number = dir.dot(dir);
      const b: number = 2 * dir.dot(P_MINUS_C);
      const c: number = P_MINUS_C.dot(P_MINUS_C) - hazard.hurtboxRadius;
      const discriminant = b*b - 4*a*c;
      if (discriminant < 0) {
        continue;
      }
      // make sure hazard is in front of player
      if ((-b + Math.sqrt(discriminant)) / (2*a) <= 0 && (-b - Math.sqrt(discriminant)) / (2*a) <= 0) {
        continue;
      }
      closestHazard = { distance, hazard };
    }

    closestHazard.hazard?.takeDamage(1);
  }

  public playerUpdate(playerId: string, playerData: PlayerSerialized) {
    const player = this.players.get(playerId);
    if (!player || !playerData || !playerData.rotation) {
      return;
    }
    player.rotation.x = playerData.rotation.x;
    player.rotation.y = playerData.rotation.y;
    player.rotation.z = playerData.rotation.z;
  }

  public finish() {
    for (const sub of this.subscriptions) {
      sub.unsubscribe();
    }
    for (const hazard of this.hazardSpawner.allHazards) {
      hazard.destroy();
    }
  }
  
  private serializeGameState(): GameStateSerialized  {
    const playersSerialized: PlayerSerialized[] = [];
    for (const [id, player] of this.players.entries()) {
      playersSerialized.push({
        userId: id,
        health: player.health.value,
        maxHealth: player.maxHealth,
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
    for (const [id, enemy] of this.hazardSpawner.enemies.value.entries()) {
      enemiesSerialized.push({
        id: id,
        health: enemy.health.value,
        maxHealth: enemy.maxHealth,
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
      projectiles: this.hazardSpawner.projectiles.value.map(proj => proj.serializedData),
      result: this.result,
    };
  }
}