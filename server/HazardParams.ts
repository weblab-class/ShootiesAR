import { Vector3 } from "three";
import HazardSpawner from "./HazardSpawner";

type HazardParams = {
  spawner: HazardSpawner,
  pos?: Vector3,
  radius?: number,
  health?: number,
};

export default HazardParams;