import { Vector3 } from "three";

export default class Enemy {
  public position: Vector3;
  public id: number;

  private static idCounter = 0;

  constructor(pos?: Vector3) {
    this.position = pos ?? new Vector3();
    this.id = Enemy.getUniqueId();
  }

  private static getUniqueId(): number {
    return this.idCounter++;
  }
}