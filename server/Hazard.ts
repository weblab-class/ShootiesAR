import { BehaviorSubject, Subscription } from "rxjs";
import { Vector3 } from "three";
import HazardParams from "./HazardParams";
import HazardSpawner from "./HazardSpawner";
import { GAME_CLOCK } from "./server-socket";

export default abstract class Hazard {
  public position: Vector3;
  public hurtboxRadius: number;
  public id: number;
  public health: BehaviorSubject<number>;

  protected readonly spawner: HazardSpawner;
  protected readonly subscriptions: Subscription[];

  private static idCounter = 0;

  // despawnCallback: (id: number) => void, pos?: Vector3
  constructor(params: HazardParams) {
    this.id = Hazard.getUniqueId();
    this.position = params.pos?.clone() ?? new Vector3();
    this.hurtboxRadius = params.radius ?? 2;
    this.health = new BehaviorSubject<number>(params.health ?? 1);
    this.spawner = params.spawner;
    this.subscriptions = [];

    this.subscriptions.push(this.health.subscribe((hp) => { 
      if (hp <= 0) {
        // destroy this
        for (const sub of this.subscriptions) {
          sub.unsubscribe();
        }
        this.destroy();
      }
    }));

    this.subscriptions.push(GAME_CLOCK.subscribe((dt) => {
      this.update(dt);
    }));
  }

  public takeDamage(amount: number) {
    this.health.next(this.health.value - amount);
  }

  public abstract destroy(): void;
  protected abstract update(dt: number): void;

  private static getUniqueId(): number {
    return this.idCounter++;
  }
}