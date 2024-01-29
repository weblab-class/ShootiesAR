import { BehaviorSubject } from "rxjs";
import { Vector3 } from "three";
import Hazard from "./Hazard";
import HazardParams from "./HazardParams";
import { GAME_CLOCK } from "./server-socket";
import ProjectileSerialized from "./ProjectileSerialized";

// projectiles are strictly enemy obstacles.
// Player projectiles are instantaneous and are only represented as an animation in the frontend.
export default abstract class Projectile extends Hazard {
  public damage: number;
  
  constructor(params: HazardParams) {
    super(params);
    this.damage = 1;
  }

  public destroy(): void {
    this.spawner.despawnProjectile(this.id);
  }

  public get serializedData(): ProjectileSerialized {
    return {
      id: this.id,
      health: this.health.value,
      radius: this.hurtboxRadius,
      position: {
        x: this.position.x,
        y: this.position.y,
        z: this.position.z,
      }
    }
  }
}