import { RoundPhase, GameState, GameType, Team } from "./GameState";
import { RandomSpectrumTarget } from "./RandomSpectrumTarget";
import { BuildGameModel } from "./BuildGameModel";
import { TFunction } from "i18next";

export function NewRound(
  playerId: string,
  gameState: GameState,
  tSpectrumCards: TFunction<"spectrum-cards">
): Partial<GameState> {
  const gameModel = BuildGameModel(
    gameState,
    () => {},
    playerId,
    tSpectrumCards,
    () => {}
  );

  let nextClueGiver = playerId;

  if (playerId === gameState.creatorId) {
    const playerIds = Object.keys(gameState.players);
    const eligiblePlayers = playerIds.filter((pid) => {
      if (pid === gameState.creatorId) {
        return false;
      }
      if (gameState.gameType === GameType.Teams) {
        return gameState.players[pid].team !== Team.Unset;
      }
      return true;
    });
    if (eligiblePlayers.length > 0) {
      nextClueGiver = eligiblePlayers[0];
    }
  }

  const newState: Partial<GameState> = {
    clueGiver: nextClueGiver,
    roundPhase: RoundPhase.GiveClue,
    deckIndex: gameState.deckIndex + 1,
    turnsTaken: gameState.turnsTaken + 1,
    spectrumTarget: RandomSpectrumTarget(),
  };

  if (gameModel.clueGiver !== null) {
    newState.previousTurn = {
      spectrumCard: gameModel.spectrumCard,
      spectrumTarget: gameState.spectrumTarget,
      clueGiverName: gameModel.clueGiver.name,
      clue: gameState.clue,
      guess: gameState.guess,
    };
  }

  return newState;
}
