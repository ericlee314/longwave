import React, { useContext, useState } from "react";
import { TeamReverse, TeamName } from "../../state/GameState";
import { Spectrum } from "../common/Spectrum";
import { CenteredColumn, CenteredRow } from "../common/LayoutElements";
import { Button } from "../common/Button";
import { GameModelContext } from "../../state/GameModelContext";
import { ScoreTeamRound } from "../../state/ScoreRound";

import { useTranslation } from "react-i18next";

export function CounterGuess() {
  const { t } = useTranslation();

  const {
    gameState,
    localPlayer,
    clueGiver,
    spectrumCard,
    setGameState,
  } = useContext(GameModelContext);
  const [pendingDirection, setPendingDirection] = useState<"left" | "right" | null>(null);

  if (!clueGiver) {
    return null;
  }

  const isGameMaster = localPlayer.id === gameState.creatorId;
  const notMyTurn = isGameMaster || clueGiver.team === localPlayer.team;
  const counterGuessTeamString = TeamName(TeamReverse(clueGiver.team), t, gameState);

  if (notMyTurn) {
    return (
      <div>
        <Spectrum spectrumCard={spectrumCard} guessingValue={gameState.guess} />
        <CenteredColumn>
          <div>
            {t("counterguess.players_clue", { givername: clueGiver.name })}:{" "}
            <strong>{gameState.clue}</strong>
          </div>
          <div>
            {t("counterguess.waiting_guess_team", {
              guessteam: counterGuessTeamString,
            })}
          </div>
        </CenteredColumn>
      </div>
    );
  }

  return (
    <div>
      <Spectrum spectrumCard={spectrumCard} guessingValue={gameState.guess} />
      <CenteredColumn>
        <div>
          {t("counterguess.players_clue", { givername: clueGiver.name })}:{" "}
          <strong>{gameState.clue}</strong>
        </div>
      </CenteredColumn>
      <CenteredRow>
        {pendingDirection === null && (
          <>
            <Button
              text={t("counterguess.more_left") as string}
              onClick={() => setPendingDirection("left")}
            />
            <Button
              text={t("counterguess.more_right") as string}
              onClick={() => setPendingDirection("right")}
            />
          </>
        )}
        {pendingDirection !== null && (
          <CenteredColumn>
            <Button
              text={
                pendingDirection === "left"
                  ? (t("counterguess.confirm_more_left") as string)
                  : (t("counterguess.confirm_more_right") as string)
              }
              onClick={() =>
                setGameState(
                  ScoreTeamRound(
                    gameState,
                    clueGiver.team,
                    pendingDirection === "left" ? "left" : "right"
                  )
                )
              }
            />
            <Button
              text={t("counterguess.cancel") as string}
              onClick={() => setPendingDirection(null)}
            />
          </CenteredColumn>
        )}
      </CenteredRow>
    </div>
  );
}
