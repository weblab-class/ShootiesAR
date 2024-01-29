import HazardParams from "./HazardParams";

type ProjectileParams = HazardParams & {
  damage: number;
}

export default ProjectileParams;