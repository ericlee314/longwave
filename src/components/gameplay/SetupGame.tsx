import React from "react";
import { GameType, RoundPhase } from "../../state/GameState";
import { CenteredColumn } from "../common/LayoutElements";
import { LongwaveAppTitle } from "../common/Title";
import { useContext, useEffect } from "react";
import { GameModelContext } from "../../state/GameModelContext";
import { NewRound } from "../../state/NewRound";

import { useTranslation } from "react-i18next";

export function SetupGame() {
  const { t } = useTranslation();
  const cardsTranslation = useTranslation("spectrum-cards");
  const { gameState, setGameState, localPlayer } = useContext(GameModelContext);

  const startGame = (gameType: GameType) => {
    if (localPlayer.id !== gameState.creatorId) {
      return;
    }
    if (gameType === GameType.Teams) {
      setGameState({
        roundPhase: RoundPhase.PickTeams,
        gameType,
      });
    } else {
      setGameState({
        ...NewRound(localPlayer.id, gameState, cardsTranslation.t),
        gameType,
      });
    }
  };

  useEffect(() => {
    if (
      gameState.roundPhase === RoundPhase.SetupGame &&
      localPlayer.id === gameState.creatorId
    ) {
      startGame(GameType.Teams);
    }
  }, [gameState.roundPhase, gameState.creatorId, localPlayer.id, startGame]);

  return (
    <CenteredColumn>
      <LongwaveAppTitle />
      {localPlayer.id !== gameState.creatorId && (
        <div style={{ color: "#666", marginTop: 8 }}>
          {t("setupgame.only_creator_can_start") as string}
        </div>
      )}
    </CenteredColumn>
  );
}
