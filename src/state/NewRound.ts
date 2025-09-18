import { RoundPhase, GameState, GameType, Team, TeamReverse } from "./GameState";
import { RandomSpectrumTarget } from "./RandomSpectrumTarget";
import { BuildGameModel } from "./BuildGameModel";
import { TFunction } from "i18next";
import { GetScore } from "./GetScore";

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

  // Determine next clue giver. If the creator (game master) triggers a new round
  // in Teams mode, pick the next player on the appropriate team using rotation indices.
  let nextClueGiver = playerId;
  let nextLeftRotationIndex = gameState.leftRotationIndex || 0;
  let nextRightRotationIndex = gameState.rightRotationIndex || 0;

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

  const leftTeamPlayers = playerIds.filter(
    (pid) => gameState.players[pid].team === Team.Left
  );
  const rightTeamPlayers = playerIds.filter(
    (pid) => gameState.players[pid].team === Team.Right
  );

  const hasPreviousClueGiver = gameModel.clueGiver !== null;

  if (playerId === gameState.creatorId && gameState.gameType === GameType.Teams) {
    if (!hasPreviousClueGiver) {
      // First round: choose the first eligible player and set rotation index accordingly
      if (eligiblePlayers.length > 0) {
        nextClueGiver = eligiblePlayers[0];
        const chosenTeam = gameState.players[nextClueGiver]?.team;
        if (chosenTeam === Team.Left) {
          const pos = Math.max(0, leftTeamPlayers.indexOf(nextClueGiver));
          nextLeftRotationIndex = leftTeamPlayers.length
            ? (pos + 1) % leftTeamPlayers.length
            : 0;
        } else if (chosenTeam === Team.Right) {
          const pos = Math.max(0, rightTeamPlayers.indexOf(nextClueGiver));
          nextRightRotationIndex = rightTeamPlayers.length
            ? (pos + 1) % rightTeamPlayers.length
            : 0;
        }
      }
    } else {
      // Subsequent rounds: compute which team goes next (alternating or catch-up rule)
      const previousClueGiverTeam = gameModel.clueGiver!.team;
      const roundScore = GetScore(gameState.spectrumTarget, gameState.guess);

      let nextTeam = TeamReverse(previousClueGiverTeam);
      if (roundScore === 4) {
        if (
          gameState.leftScore < gameState.rightScore &&
          previousClueGiverTeam === Team.Left
        ) {
          nextTeam = Team.Left; // catch-up bonus turn
        } else if (
          gameState.rightScore < gameState.leftScore &&
          previousClueGiverTeam === Team.Right
        ) {
          nextTeam = Team.Right; // catch-up bonus turn
        }
      }

      if (nextTeam === Team.Left && leftTeamPlayers.length > 0) {
        const idx = leftTeamPlayers.length
          ? nextLeftRotationIndex % leftTeamPlayers.length
          : 0;
        nextClueGiver = leftTeamPlayers[idx];
        nextLeftRotationIndex = leftTeamPlayers.length
          ? (idx + 1) % leftTeamPlayers.length
          : 0;
      } else if (nextTeam === Team.Right && rightTeamPlayers.length > 0) {
        const idx = rightTeamPlayers.length
          ? nextRightRotationIndex % rightTeamPlayers.length
          : 0;
        nextClueGiver = rightTeamPlayers[idx];
        nextRightRotationIndex = rightTeamPlayers.length
          ? (idx + 1) % rightTeamPlayers.length
          : 0;
      } else if (eligiblePlayers.length > 0) {
        // Fallback if team arrays are empty
        nextClueGiver = eligiblePlayers[0];
      }
    }
  } else if (playerId === gameState.creatorId) {
    // Non-team modes: still let creator choose the first eligible player
    if (eligiblePlayers.length > 0) {
      nextClueGiver = eligiblePlayers[0];
    }
  } else {
    // Non-creator triggering: keep previous behavior
    nextClueGiver = playerId;
  }

  const newState: Partial<GameState> = {
    clueGiver: nextClueGiver,
    roundPhase: RoundPhase.GiveClue,
    deckIndex: gameState.deckIndex + 1,
    turnsTaken: gameState.turnsTaken + 1,
    spectrumTarget: RandomSpectrumTarget(),
    leftRotationIndex: nextLeftRotationIndex,
    rightRotationIndex: nextRightRotationIndex,
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
