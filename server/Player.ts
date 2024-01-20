import { Vector3, Euler } from "three";

export default class Player {
  public position: Vector3;
  public rotation: Euler;

  constructor(pos?: Vector3, rot?: Euler) {
    this.position = pos ?? new Vector3();
    this.rotation = rot ?? new Euler();
  }
}