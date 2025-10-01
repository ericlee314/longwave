import { TFunction } from "i18next";
import { GameType, PlayersTeams, GameState, Team } from "./GameState";
import { NewRound } from "./NewRound";

export function NewTeamGame(
  players: PlayersTeams,
  startPlayer: string,
  gameState: GameState,
  tSpectrumCards: TFunction<"spectrum-cards">
): Partial<GameState> {
  // Determine the first clue giver using NewRound, then award 1 point to the
  // opposite team (the second team to guess).
  const nextRound = NewRound(startPlayer, gameState, tSpectrumCards);

  const initialScores: Partial<GameState> = {
    leftScore: 0,
    rightScore: 0,
  };

  const firstClueGiverId = (nextRound.clueGiver as string) || "";
  const firstClueGiverTeam = players[firstClueGiverId]?.team;

  if (firstClueGiverTeam === Team.Left) {
    initialScores.rightScore = 1;
  } else if (firstClueGiverTeam === Team.Right) {
    initialScores.leftScore = 1;
  }

  return {
    ...nextRound,
    ...initialScores,
    previousTurn: null,
    gameType: GameType.Teams,
  };
}
