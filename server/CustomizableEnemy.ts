import { Vector3 } from "three";
import Enemy from "./Enemy";
import HazardParams from "./HazardParams";
import StraightProjectile from "./StraightProjectile";

export type EnemyParams = HazardParams & {
  oscillationDirection: "vertical" | "horizontal" | "diagonal1" | "diagonal2";
  oscillationMoveDuration: number;
  oscillationPauseDuration: number;
  speed: number;
  shootDelay: number;
  burstAmount: number; // number of shots done in quick succession;
  burstDelay: number; // time between burst shots
  strength: number; // the scaling to apply to the projectile it spawns
}

export default class CustomizableEnemy extends Enemy {
  private shootingTimer: number;
  private burstCounter: number;
  private direction: Vector3;
  private params: EnemyParams;
  private state: "move" | "pause";
  private actionTimer: number;

  constructor(params: EnemyParams) {
    super(params);
    this.shootingTimer = params.shootDelay;
    this.burstCounter = params.burstAmount;
    this.params = params;
    this.state = "move";
    this.actionTimer = params.oscillationMoveDuration / 2;
    switch (params.oscillationDirection) {
      case "horizontal":
        this.direction = new Vector3(-this.position.z, 0, this.position.x).normalize();
        break;
      case "vertical":
        this.direction = new Vector3(0, 1, 0).normalize();
        break;
      case "diagonal1":
        this.direction = new Vector3(-this.position.z, 0, this.position.x).normalize().add(new Vector3(0, 1, 0).normalize());
        break;
      case "diagonal2":
        this.direction = new Vector3(this.position.z, 0, -this.position.x).normalize().add(new Vector3(0, 1, 0).normalize());
        break;
    }
  }

  update(dt: number): void {
    this.shootingTimer -= dt;
    this.actionTimer += dt;
    if (this.state === "move") {
      this.position.add(this.direction.multiplyScalar(this.params.speed * dt));
      if (this.actionTimer > this.params.oscillationMoveDuration) {
        this.state = "pause";
        this.actionTimer = 0;
      }
    } else { // this.state === "pause"
      if (this.actionTimer > this.params.oscillationPauseDuration) {
        this.state = "move";
        this.actionTimer = 0;
      }
    }
    if (this.shootingTimer < 0) {
      // shoot
      if (this.spawner.projectiles.value.length < 100) {
        // choose a player to target:
        const allPlayers = this.spawner.gameManager.players;
        const targetPlayer = Array.from(allPlayers.values())[Math.floor(Math.random() * allPlayers.size)];
        // spawn a projectile
        const projectile = new StraightProjectile({
          spawner: this.spawner,
          direction: targetPlayer.position.clone().sub(this.position),
          speed: 5 * Math.sqrt(this.params.strength),
          radius: .25 * Math.sqrt(this.params.strength),
          health: .75 * this.params.strength ** .75,
          damage: 5 * this.params.strength,
          pos: this.position.clone(),
        })
        this.spawner.registerProjectile(projectile);
        this.shootingTimer = 5*Math.random()+5;
      }
      this.burstCounter--;
      if (this.burstCounter > 0) {
        this.shootingTimer = this.params.burstDelay;
      } else {
        this.burstCounter = this.params.burstAmount;
        this.shootingTimer = this.params.shootDelay;
      }
    }
  }
}