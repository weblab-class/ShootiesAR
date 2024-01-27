import { Vector3 } from "three";
import Enemy from "./Enemy";
import { BehaviorSubject, Observable } from "rxjs";

const ENEMY_SPAWN_PERIOD_MS = 5000;

export default class EnemySpawner {
  public readonly enemies: BehaviorSubject<Enemy[]>;

  public currentWave: number;
  public readonly waveOver = new BehaviorSubject<boolean>(true);

  public constructor() {
    this.currentWave = 0;
    this.enemies = new BehaviorSubject<Enemy[]>([]);
  }

  public startWave() {
    this.currentWave++;
    this.waveOver.next(false);

    setInterval(() => {
      if (this.enemies.value.length < 100) {
        this.spawnEnemy();
      }
    }, ENEMY_SPAWN_PERIOD_MS);
  }

  public spawnEnemy(): Enemy {
    const newEnemy = new Enemy((id) => this.despawnEnemy(id), new Vector3(10*Math.random()-5, 3*Math.random(), -10*Math.random()-10));
    this.enemies.next(this.enemies.value.concat([newEnemy]));
    return newEnemy;
  }

  public despawnEnemy(id: number) {
    if (this.enemies.value.some(enemy => enemy.id === id)) {
      this.enemies.next(this.enemies.value.filter(enemy => enemy.id !== id));
    } else {
      console.error(`ID ${id} not found in enemy array ${this.enemies.value}`);
    }
  }
}