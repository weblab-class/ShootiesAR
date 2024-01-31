import { BehaviorSubject } from "rxjs";
import { Vector3, Euler } from "three";

type PlayerParams = {
  position?: Vector3,
  rotation?: Euler,
  health?: number,
  healthScaling?: number,
  damageScaling?: number,
  healingScaling?: number,
  hurtboxRadius?: number,
}

export default class Player {
  public position: Vector3;
  public rotation: Euler;
  public readonly health: BehaviorSubject<number>;
  public readonly maxHealth: number;
  public readonly healthScaling: number;
  public readonly damageScaling: number;
  public readonly healingScaling: number;
  public hurboxRadius: number;
  public fired: boolean;

  constructor(params: PlayerParams) {
    this.position = params.position?.clone() ?? new Vector3();
    this.rotation = params.rotation?.clone() ?? new Euler(0, 0, 0, "YXZ");
    this.fired = false;
    this.health = new BehaviorSubject<number>(params.health ?? 100);
    this.maxHealth = this.health.value;
    this.healthScaling = params.healthScaling ?? 1;
    this.damageScaling = params.damageScaling ?? 1;
    this.healingScaling = params.healingScaling ?? 1;
    this.hurboxRadius = params.hurtboxRadius ?? 1;
  }
}