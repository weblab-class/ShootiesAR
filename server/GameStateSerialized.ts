import EnemySerialized from "./EnemySerialized";
import PlayerSerialized from "./PlayerSerialized";

type GameStateSerialized = {
  players: PlayerSerialized[];
  enemies: EnemySerialized[];
};

export default GameStateSerialized;