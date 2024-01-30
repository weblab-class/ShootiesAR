import { Vector3 } from "three";
import Enemy from "./Enemy";
import HazardParams from "./HazardParams";
import StraightProjectile from "./StraightProjectile";
import { GAME_CLOCK } from "./server-socket";

export default class StationaryEnemy extends Enemy {
  private cooldownTimer: number;
  clock: number;

  constructor(params: HazardParams) {
    super(params);
    this.cooldownTimer = 5;
    this.clock = 0;
  }

  update(dt: number): void {
    this.cooldownTimer -= dt;
    this.clock += dt;
    if (Math.floor(this.clock) % 2 == 0) {
      this.position.add(new Vector3(5*dt, 0, 0))
    } else {
      this.position.add(new Vector3(-5*dt, 0, 0))
    }
    if (this.cooldownTimer < 0) {
      if (this.spawner.projectiles.value.length > 100) {
        return;
      }
      // choose a player to target:
      const allPlayers = this.spawner.gameManager.players;
      const targetPlayer = Array.from(allPlayers.values())[Math.floor(Math.random() * allPlayers.size)];
      // spawn a projectile
      const projectile = new StraightProjectile({
        spawner: this.spawner,
        direction: targetPlayer.position.clone().sub(this.position),
        speed: 5,
        radius: 1,
        health: 1,
        damage: 1,
        pos: this.position.clone(),
      })
      this.spawner.registerProjectile(projectile);
      this.cooldownTimer = 5*Math.random()+5;
    }
  }
}