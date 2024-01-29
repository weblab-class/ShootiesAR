import EnemySerialized from "./EnemySerialized";
import GameResult from "./GameResult";
import PlayerSerialized from "./PlayerSerialized";
import ProjectileSerialized from "./ProjectileSerialized";

type GameStateSerialized = {
  players: PlayerSerialized[];
  enemies: EnemySerialized[];
  projectiles: ProjectileSerialized[];
  result: GameResult | null;
};

export default GameStateSerialized;