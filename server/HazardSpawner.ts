import { Vector3 } from "three";
import Enemy from "./Enemy";
import { BehaviorSubject } from "rxjs";
import Projectile from "./Projectile";
import GameManager from "./GameManager";
import StationaryEnemy from "./StationaryEnemy";
import Hazard from "./Hazard";

const ENEMY_SPAWN_PERIOD_MS = 5000;

export default class HazardSpawner {
  public readonly enemies: BehaviorSubject<Enemy[]>;
  public readonly projectiles: BehaviorSubject<Projectile[]>;
  public readonly gameManager: GameManager;

  public currentWave: number;
  public readonly waveOver = new BehaviorSubject<boolean>(true);

  public get allHazards() { return new Array<Hazard>().concat(this.enemies.value).concat(this.projectiles.value); }

  public constructor(gameManager: GameManager) {
    this.currentWave = 0;
    this.enemies = new BehaviorSubject<Enemy[]>([]);
    this.projectiles = new BehaviorSubject<Projectile[]>([]);
    this.gameManager = gameManager;
  }

  public startWave() {
    this.currentWave++;
    this.waveOver.next(false);

    setInterval(() => {
      if (this.enemies.value.length < 4) {
        this.spawnEnemy();
      }
    }, ENEMY_SPAWN_PERIOD_MS);
  }

  public spawnEnemy(): Enemy {
    const newEnemy = new StationaryEnemy({
      spawner: this,
      pos: new Vector3(10*Math.random()-5, 3*Math.random(), -10*Math.random()-10),
      health: 10,
    });
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

  public registerProjectile(projectile: Projectile) {
    this.projectiles.next(this.projectiles.value.concat([projectile]));
  }

  public despawnProjectile(id: number) {
    if (this.projectiles.value.some(proj => proj.id === id)) {
      this.projectiles.next(this.projectiles.value.filter(proj => proj.id !== id));
    } else {
      console.error(`ID ${id} not found in enemy array ${this.projectiles.value}`);
    }
  }
}