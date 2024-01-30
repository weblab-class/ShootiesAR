type PlayerSerialized = {
  userId: string;
  health: number;
  maxHealth: number;
  position: {
    x: number,
    y: number,
    z: number,
  };
  rotation: {
    x: number,
    y: number,
    z: number,
  };
  fired: boolean;
};

export default PlayerSerialized;