import { Vector3 } from "three";
import HazardParams from "./HazardParams";
import Projectile from "./Projectile";
import { GAME_CLOCK } from "./server-socket";
import ProjectileParams from "./ProjectileParams";

type StraightProjectileParams = ProjectileParams & {
  direction: Vector3;
  /** in meters/second */
  speed: number;
}

export default class StraightProjectile extends Projectile {
  public direction: Vector3;
  public speed: number;
  
  constructor(params: StraightProjectileParams) {
    super(params);
    this.direction = params.direction.clone().normalize();
    this.damage = params.damage
    this.speed = params.speed;
  }

  protected update(dt: number): void {
    this.position.add(this.direction.clone().multiplyScalar(this.speed * dt));
  }
}

const debug = (v: Vector3) => `x: ${v.x}, y: ${v.y}, z: ${v.z}`;