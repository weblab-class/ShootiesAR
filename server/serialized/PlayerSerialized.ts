type PlayerSerialized = {
  socketId: string;
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