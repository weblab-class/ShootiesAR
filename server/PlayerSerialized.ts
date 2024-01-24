type PlayerSerialized = {
  userId: string;
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
};

export default PlayerSerialized;