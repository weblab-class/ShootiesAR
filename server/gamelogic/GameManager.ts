import EnemySpawner from "./EnemySpawner";

export default class GameManager {
  private enemySpawner: EnemySpawner;

  constructor() {
    this.enemySpawner = new EnemySpawner();
  }
}