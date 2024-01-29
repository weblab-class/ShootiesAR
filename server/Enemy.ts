import Hazard from "./Hazard";
import HazardParams from "./HazardParams";

export default abstract class Enemy extends Hazard {
  constructor(params: HazardParams) {
    super(params);

  }

  protected destroy(): void {
    this.spawner.despawnEnemy(this.id);
  }
}