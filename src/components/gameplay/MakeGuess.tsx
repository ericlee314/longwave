import React, { useContext, useState } from "react";
import { GameType, RoundPhase, TeamName } from "../../state/GameState";
import { Spectrum } from "../common/Spectrum";
import { CenteredColumn } from "../common/LayoutElements";
import { Button } from "../common/Button";
import { GameModelContext } from "../../state/GameModelContext";
import { RecordEvent } from "../../TrackEvent";
import { ScoreCoopRound } from "../../state/ScoreRound";

import { useTranslation } from "react-i18next";

export function MakeGuess() {
  const { t } = useTranslation();
  const { gameState, localPlayer, clueGiver, spectrumCard, setGameState } =
    useContext(GameModelContext);
  const [confirming, setConfirming] = useState(false);

  if (!clueGiver) {
    return null;
  }

  const isGameMaster = localPlayer.id === gameState.creatorId;
  const notMyTurn =
    isGameMaster ||
    localPlayer.id === clueGiver.id ||
    (gameState.gameType === GameType.Teams &&
      localPlayer.team !== clueGiver.team);

  const guessingTeamString = TeamName(clueGiver.team, t);

  if (notMyTurn) {
    return (
      <div>
        <Spectrum spectrumCard={spectrumCard} guessingValue={gameState.guess} />
        <CenteredColumn>
          <div>
            {t("makeguess.players_clue", { givername: clueGiver.name })}:{" "}
            <strong>{gameState.clue}</strong>
          </div>
          <div>
            {t("makeguess.waiting_guessing_team", {
              guessingteam: guessingTeamString,
            })}
          </div>
          {Object.keys(gameState.players).length < 2 && (
            <div
              style={{
                margin: 12,
                padding: "0 1em",
                border: "1px solid black",
              }}
            >
              <p>{t("makeguess.invite_other_players") as string}</p>
              <p>
                {t("makeguess.share_game_url", {
                  game_url: window.location.href,
                })}
              </p>
            </div>
          )}
        </CenteredColumn>
      </div>
    );
  }

  return (
    <div>
      <Spectrum
        spectrumCard={spectrumCard}
        handleValue={gameState.guess}
        onChange={(guess: number) => {
          setGameState({
            guess,
          });
          setConfirming(false);
        }}
      />
      <CenteredColumn>
        <div>
          {t("makeguess.players_clue", { givername: clueGiver.name })}:{" "}
          <strong>{gameState.clue}</strong>
        </div>
        <div>
          {!confirming ? (
            <Button
              text={t("makeguess.guess_for_team", {
                teamname: TeamName(localPlayer.team, t),
              })}
              onClick={() => setConfirming(true)}
            />
          ) : (
            <>
              <Button
                text={t("makeguess.confirm_guess_for_team", {
                  teamname: TeamName(localPlayer.team, t),
                })}
                onClick={() => {
                  RecordEvent("guess_submitted", {
                    spectrum_card: spectrumCard.join("|"),
                    clue: gameState.clue,
                    target: gameState.spectrumTarget.toString(),
                    guess: gameState.guess.toString(),
                  });

                  if (gameState.gameType === GameType.Teams) {
                    setGameState({
                      roundPhase: RoundPhase.CounterGuess,
                    });
                  } else if (gameState.gameType === GameType.Cooperative) {
                    setGameState(ScoreCoopRound(gameState));
                  } else {
                    setGameState({
                      roundPhase: RoundPhase.ViewScore,
                    });
                  }
                  setConfirming(false);
                }}
              />
              <Button
                text={t("makeguess.cancel") as string}
                onClick={() => setConfirming(false)}
              />
            </>
          )}
        </div>
      </CenteredColumn>
    </div>
  );
}
