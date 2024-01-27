import { BehaviorSubject } from "rxjs";
import { Vector3 } from "three";

export default class Enemy {
  public position: Vector3;
  public hitboxRadius: number;
  public id: number;
  public health: BehaviorSubject<number>;

  private static idCounter = 0;
  private despawnCallback: (id: number) => void;

  constructor(despawnCallback: (id: number) => void, pos?: Vector3) {
    this.position = pos ?? new Vector3();
    this.hitboxRadius = 2;
    this.id = Enemy.getUniqueId();
    this.health = new BehaviorSubject<number>(1);
    this.despawnCallback = despawnCallback;

    this.health.subscribe((hp) => { if (hp <= 0) this.die() })
  }

  public takeDamage(amount: number) {
    this.health.next(this.health.value - amount);
  }

  private die() {
    // todo: trigger some death animation on the client side
    setTimeout(() => {
      this.despawnCallback(this.id);
    }, 0);
  }

  private static getUniqueId(): number {
    return this.idCounter++;
  }
}