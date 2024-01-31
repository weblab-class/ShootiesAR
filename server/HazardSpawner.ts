import { Vector3 } from "three";
import Enemy from "./Enemy";
import { BehaviorSubject, Subscription, combineLatest } from "rxjs";
import Projectile from "./Projectile";
import GameManager from "./GameManager";
import CustomizableEnemy, { EnemyParams } from "./CustomizableEnemy";
import Hazard from "./Hazard";

const ENEMY_SPAWN_PERIOD_MS = 1000;
const ENEMY_SPAWN_CIRCLE_RADIUS = 20;

export default class HazardSpawner {
  public readonly enemies: BehaviorSubject<Enemy[]>;
  public readonly projectiles: BehaviorSubject<Projectile[]>;
  public readonly gameManager: GameManager;

  public currentWave: number;
  public spawnQueue: EnemyParams[];
  public spawnTheta: number;

  private subscriptions: Subscription[];

  public get allHazards() { return new Array<Hazard>().concat(this.enemies.value).concat(this.projectiles.value); }

  public constructor(gameManager: GameManager) {
    this.currentWave = 0;
    this.enemies = new BehaviorSubject<Enemy[]>([]);
    this.projectiles = new BehaviorSubject<Projectile[]>([]);
    this.gameManager = gameManager;
    this.spawnQueue = [];
    this.spawnTheta = Math.random() * 2 * Math.PI;
    this.subscriptions = [];
  }

  public startSpawning() {
    this.subscriptions.push(combineLatest([this.enemies, this.projectiles]).subscribe(([enemies, projectiles]) => {
      if (enemies.length === 0 && projectiles.length === 0 && this.spawnQueue.length === 0) {
        // start next wave
        const ENEMY_STRENGTH = 1.15 ** this.currentWave;
        this.currentWave++;
        this.spawnTheta = Math.random() * 2 * Math.PI;
        for (let i=0; i<this.currentWave; i++) {
          this.spawnTheta += (Math.random() * 16 * this.currentWave - 8 * this.currentWave) * Math.PI / 180;
          const x = ENEMY_SPAWN_CIRCLE_RADIUS * Math.cos(this.spawnTheta);
          const z = ENEMY_SPAWN_CIRCLE_RADIUS * Math.sin(this.spawnTheta);
          this.spawnQueue.push({
            spawner: this,
            pos: new Vector3(x, 6*Math.random()-3*Math.random(), z),
            health: .5 * ENEMY_STRENGTH ** 1.5,
            // @ts-ignore
            oscillationDirection: ["horizontal", "vertical", "diagonal1", "diagonal2"][Math.floor(4 * Math.random())],
            speed: [0, 2, 5][Math.floor(3 * Math.random())],
            burstAmount: [1, 1, 1, 1, Math.floor(ENEMY_STRENGTH)][Math.floor(5 * Math.random())],
            burstDelay: .5,
            oscillationMoveDuration: 2*Math.random() + 1,
            oscillationPauseDuration: 2*Math.random() + 1,
            shootDelay: 3*Math.random() + 4,
            radius: 2 * ENEMY_STRENGTH ** .5,
            strength: ENEMY_STRENGTH * (.4 * Math.random() + .8),
          })
          setTimeout(() => {
            const enemy = this.spawnQueue.pop();
            if (!enemy) {
              return; // should not get here
            }
            this.enemies.next(this.enemies.value.concat([new CustomizableEnemy(enemy)]));
          }, ENEMY_SPAWN_PERIOD_MS * (i + 1));
        }
      }
    }))
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

  public finish() {
    for (const sub of this.subscriptions) {
      sub.unsubscribe();
    }
  }
}