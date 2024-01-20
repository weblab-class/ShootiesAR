import { Vector3 } from "three";
import Enemy from "./Enemy";
import { BehaviorSubject, Observable } from "rxjs";

const ENEMY_SPAWN_PERIOD_MS = 5000;

export default class EnemySpawner {
  private _enemies: BehaviorSubject<Enemy[]>;
  public readonly enemies: Observable<Enemy[]>;
  public get currentEnemies() { return this._enemies.value; }

  public currentWave: number;
  public waveOver: boolean;

  public constructor() {
    this.currentWave = 0;
    this.waveOver = true;

    this._enemies = new BehaviorSubject<Enemy[]>([]);
    this.enemies = this._enemies.asObservable();
  }

  public startWave() {
    this.currentWave++;
    this.waveOver = false;

    setInterval(() => {
      this.spawnEnemy();
    }, ENEMY_SPAWN_PERIOD_MS);
  }

  public spawnEnemy(): Enemy {
    const newEnemy = new Enemy(new Vector3(50*Math.random()-25, 3*Math.random(), 10*Math.random()+10));
    this._enemies.next(this._enemies.value.concat([newEnemy]));
    return newEnemy;
  }

  public despawnEnemy(id: number) {
    if (this._enemies.value.some(enemy => enemy.id === id)) {
      this._enemies.next(this._enemies.value.filter(enemy => enemy.id !== id));
    } else {
      console.error(`ID ${id} not found in enemy array ${this._enemies.value}`);
    }
  }
}