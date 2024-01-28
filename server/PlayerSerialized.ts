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
  fired: boolean;
};

export default PlayerSerialized;