type ProjectileSerialized = {
  id: number;
  health: number;
  maxHealth: number;
  radius: number;
  position: {
    x: number,
    y: number,
    z: number,
  };
};

export default ProjectileSerialized;