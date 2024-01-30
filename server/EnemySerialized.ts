type EnemySerialized = {
  id: number;
  health: number;
  maxHealth: number;
  position: {
    x: number,
    y: number,
    z: number,
  };
};

export default EnemySerialized;