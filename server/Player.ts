import { Vector3, Euler } from "three";

export default class Player {
  public position: Vector3;
  public rotation: Euler;
  public fired: boolean;

  constructor(pos?: Vector3, rot?: Euler) {
    this.position = pos ?? new Vector3();
    this.rotation = rot ?? new Euler(0, 0, 0, "YXZ");
    this.fired = false;
  }
}