import React from "react";
import { GameType, RoundPhase } from "../../state/GameState";
import { CenteredRow, CenteredColumn } from "../common/LayoutElements";
import { Button } from "../common/Button";
import { LongwaveAppTitle } from "../common/Title";
import { useContext } from "react";
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

  return (
    <CenteredColumn>
      <LongwaveAppTitle />
      <CenteredRow style={{ flexWrap: "wrap" }}>
        <Button
          text={t("setupgame.standard_game") as string}
          onClick={() => startGame(GameType.Teams)}
          disabled={localPlayer.id !== gameState.creatorId}
        />
        <Button
          text={t("setupgame.coop_game") as string}
          onClick={() => startGame(GameType.Cooperative)}
          disabled={localPlayer.id !== gameState.creatorId}
        />
        <Button
          text={t("setupgame.free_game") as string}
          onClick={() => startGame(GameType.Freeplay)}
          disabled={localPlayer.id !== gameState.creatorId}
        />
      </CenteredRow>
      {localPlayer.id !== gameState.creatorId && (
        <div style={{ color: "#666", marginTop: 8 }}>
          {t("setupgame.only_creator_can_start")}
        </div>
      )}
    </CenteredColumn>
  );
}
