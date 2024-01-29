import { BehaviorSubject } from "rxjs";
import { Vector3, Euler } from "three";

export default class Player {
  public position: Vector3;
  public rotation: Euler;
  public health: BehaviorSubject<number>;
  public fired: boolean;

  constructor(pos?: Vector3, rot?: Euler) {
    this.position = pos?.clone() ?? new Vector3();
    this.rotation = rot ?? new Euler(0, 0, 0, "YXZ");
    this.fired = false;
    this.health = new BehaviorSubject<number>(1);
  }
}