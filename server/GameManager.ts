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

const BASE_PLAYER_HEALTH = 100;
const BASE_HEALING_AMOUNT = 1;
const BASE_PLAYER_DAMAGE = 1;

const PLAYER_CIRCLE_RADIUS = 5;

export default class GameManager {
  public readonly gameState: BehaviorSubject<GameStateSerialized>;
  public readonly gameOver: BehaviorSubject<boolean>;
  public readonly players: Map<string, Player>;
  private result: GameResult | null;
  private readonly hazardSpawner: HazardSpawner;
  private readonly subscriptions: Subscription[];
  private readonly id: number;

  private static idCounter = 0;

  constructor(players: string[], playersToMultipliers: Map<string, { health: number, damage: number, healing: number }>) {
    this.hazardSpawner = new HazardSpawner(this);
    this.gameOver = new BehaviorSubject<boolean>(false);
    this.result = null;
    this.subscriptions = [];
    this.id = GameManager.idCounter++;

    this.players = new Map<string, Player>();
    
    let p = 0;
    for (const playerId of players) {
      // compute coordinates of player within circle
      const angle = (p / players.length) * 2 * Math.PI;
      const x = PLAYER_CIRCLE_RADIUS * Math.cos(angle);
      const z = PLAYER_CIRCLE_RADIUS * Math.sin(angle);
      p++;
  
      const multipliers = playersToMultipliers.get(playerId);
      console.log(`player: ${playerId}, x: ${x}, y: ${0}, z: ${z}`)
      this.players.set(playerId, new Player({
        position: new Vector3(x, 0, z),
        health: BASE_PLAYER_HEALTH * (multipliers?.health ?? 1),
        healthScaling: multipliers?.health ?? 1,
        damageScaling: multipliers?.damage ?? 1,
        healingScaling: multipliers?.healing ?? 1,
        hurtboxRadius: 2
      }));
    }

    this.gameState = new BehaviorSubject<GameStateSerialized>(this.serializeGameState());

    setTimeout(() => {
      this.hazardSpawner.startSpawning();
    }, 0); // 10000
  
    // check for collisions between projectiles and player
    this.subscriptions.push(GAME_CLOCK.subscribe(() => {
      for (const player of this.players.values()) {
        for (const projectile of this.hazardSpawner.projectiles.value) {
          if (projectile.position.distanceTo(player.position) < projectile.hurtboxRadius) {
            player.health.next(player.health.value - projectile.damage);
            projectile.destroy();
          }
        }
      }
    }));

    for (const player of this.players.values()) {
      this.subscriptions.push(player.health.subscribe((hp) => {
        if (hp <= 0 && this.result === null) {
          this.result = {
            wave: this.hazardSpawner.currentWave,
            id: this.id,
          };
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

    if (closestHazard.hazard) {
      closestHazard.hazard.takeDamage(player.damageScaling * BASE_PLAYER_DAMAGE);
      return;
    }

    for (const [id, ally] of this.players.entries()) {
      if (id === playerId) {
        continue; // can't heal self
      }
      const P_MINUS_C = player.position.clone().sub(ally.position);
      const a: number = dir.dot(dir);
      const b: number = 2 * dir.dot(P_MINUS_C);
      const c: number = P_MINUS_C.dot(P_MINUS_C) - ally.hurboxRadius;
      const discriminant = b*b - 4*a*c;
      if (discriminant < 0) {
        continue;
      }
      // make sure ally is in front of player
      if ((-b + Math.sqrt(discriminant)) / (2*a) <= 0 && (-b - Math.sqrt(discriminant)) / (2*a) <= 0) {
        continue;
      }
      ally.health.next(Math.min(ally.health.value + player.healingScaling * BASE_HEALING_AMOUNT, player.maxHealth))
    }
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
    this.hazardSpawner.finish();
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
      wave: this.hazardSpawner.currentWave,
    };
  }
}