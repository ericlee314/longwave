import React, { useContext } from "react";
import { GetScore } from "../../state/GetScore";
import { CenteredColumn, CenteredRow } from "../common/LayoutElements";
import { Spectrum } from "../common/Spectrum";
import { Button } from "../common/Button";
import {
  GameType,
  Team,
  InitialGameState,
  TeamName,
  TeamReverse,
  DEFAULT_POINTS_TO_WIN,
} from "../../state/GameState";
import { GameModelContext } from "../../state/GameModelContext";
import { NewRound } from "../../state/NewRound";
import { Info } from "../common/Info";

import { Trans, useTranslation } from "react-i18next";

export function ViewScore() {
  const { t } = useTranslation();
  const { gameState, clueGiver, spectrumCard } = useContext(GameModelContext);

  if (!clueGiver) {
    return null;
  }

  let score = GetScore(gameState.spectrumTarget, gameState.guess);
  let bonusCoopTurn = false;
  if (gameState.gameType === GameType.Cooperative && score === 4) {
    score = 3;
    bonusCoopTurn = true;
  }

  const wasCounterGuessCorrect =
    (gameState.counterGuess === "left" &&
      gameState.spectrumTarget < gameState.guess) ||
    (gameState.counterGuess === "right" &&
      gameState.spectrumTarget > gameState.guess);

  return (
    <div>
      <Spectrum
        spectrumCard={spectrumCard}
        handleValue={gameState.guess}
        targetValue={gameState.spectrumTarget}
      />
      <CenteredColumn>
        <div>
          {t("viewscore.player_clue", { givername: clueGiver.name }) as string}:{" "}
          <strong>{gameState.clue}</strong>
        </div>
        <div>
          {t("viewscore.score")}: {score} {t("viewscore.points") as string}!
        </div>
        {gameState.gameType === GameType.Teams && (
          <div>
            {TeamName(TeamReverse(clueGiver.team), t, gameState)} {t("viewscore.got") as string}{" "}
            {wasCounterGuessCorrect
              ? t("viewscore.1_point_correct_guess")
              : t("viewscore.0_point_wrong_guess")}
          </div>
        )}
        {bonusCoopTurn && (
          <Trans
            i18nKey={t("viewscore.bonus_turn") as string}
            components={{
              strong: <strong />,
            }}
          />
        )}
        <NextTurnOrEndGame />
      </CenteredColumn>
    </div>
  );
}

function NextTurnOrEndGame() {
  const { t, i18n } = useTranslation();
  const cardsTranslation = useTranslation("spectrum-cards");
  const { gameState, localPlayer, clueGiver, setGameState } =
    useContext(GameModelContext);
  const pointsToWin = gameState.pointsToWin ?? DEFAULT_POINTS_TO_WIN;

  if (!clueGiver) {
    return null;
  }

  const resetButton = (
    <Button
      text={t("viewscore.reset_game") as string}
      onClick={() => {
        setGameState({
          ...InitialGameState(i18n.language),
          deckSeed: gameState.deckSeed,
          deckIndex: gameState.deckIndex,
          creatorId: gameState.creatorId,
          leftTeamName: gameState.leftTeamName,
          rightTeamName: gameState.rightTeamName,
          leftTeamOrder: gameState.leftTeamOrder,
          rightTeamOrder: gameState.rightTeamOrder,
          pointsToWin,
        });
      }}
    />
  );

  if (
    gameState.leftScore >= pointsToWin &&
    gameState.leftScore > gameState.rightScore
  ) {
    return (
      <>
        <div>
          {t("viewscore.winning_team", { winnerteam: TeamName(Team.Left, t, gameState) }) as string}
        </div>
        {resetButton}
      </>
    );
  }

  if (
    gameState.rightScore >= pointsToWin &&
    gameState.rightScore > gameState.leftScore
  ) {
    return (
      <>
        <div>
          {t("viewscore.winning_team", { winnerteam: TeamName(Team.Right, t, gameState) }) as string}
        </div>
        {resetButton}
      </>
    );
  }

  if (
    gameState.gameType === GameType.Cooperative &&
    gameState.turnsTaken >= 7 + gameState.coopBonusTurns
  ) {
    return (
      <>
        <div>{t("viewscore.game_finished") as string}</div>
        <div>
          {t("viewscore.final_score_team") as string}:{" "}
          <strong>
            {gameState.coopScore} {t("viewscore.points") as string}
          </strong>
        </div>
        {resetButton}
      </>
    );
  }

  const score = GetScore(gameState.spectrumTarget, gameState.guess);

  const scoringTeamString = TeamName(clueGiver.team, t, gameState);

  let bonusTurn = false;

  const nextTeam = (() => {
    if (gameState.gameType !== GameType.Teams) {
      return Team.Unset;
    }

    if (score === 4) {
      if (
        gameState.leftScore < gameState.rightScore &&
        clueGiver.team === Team.Left
      ) {
        bonusTurn = true;
        return Team.Left;
      }
      if (
        gameState.rightScore < gameState.leftScore &&
        clueGiver.team === Team.Right
      ) {
        bonusTurn = true;
        return Team.Right;
      }
    }

    return TeamReverse(clueGiver.team);
  })();

  const nextClueGiverName = (() => {
    if (gameState.gameType !== GameType.Teams) {
      return "";
    }

    const playerIds = Object.keys(gameState.players);
    const eligiblePlayers = playerIds.filter(
      (pid) => gameState.players[pid].team !== Team.Unset && pid !== gameState.creatorId
    );
    const leftTeamPlayers = (gameState.leftTeamOrder && gameState.leftTeamOrder.length
      ? gameState.leftTeamOrder
      : playerIds
    ).filter((pid) => gameState.players[pid].team === Team.Left);
    const rightTeamPlayers = (gameState.rightTeamOrder && gameState.rightTeamOrder.length
      ? gameState.rightTeamOrder
      : playerIds
    ).filter((pid) => gameState.players[pid].team === Team.Right);

    let nextId: string | null = null;
    if (nextTeam === Team.Left && leftTeamPlayers.length > 0) {
      const idx = leftTeamPlayers.length
        ? gameState.leftRotationIndex % leftTeamPlayers.length
        : 0;
      nextId = leftTeamPlayers[idx];
    } else if (nextTeam === Team.Right && rightTeamPlayers.length > 0) {
      const idx = rightTeamPlayers.length
        ? gameState.rightRotationIndex % rightTeamPlayers.length
        : 0;
      nextId = rightTeamPlayers[idx];
    } else if (eligiblePlayers.length > 0) {
      nextId = eligiblePlayers[0];
    }

    return nextId ? gameState.players[nextId]?.name : "";
  })();

  const eligibleToDraw = (() => {
    if (clueGiver.id === localPlayer.id) {
      return false;
    }

    if (gameState.gameType !== GameType.Teams) {
      return localPlayer.id !== gameState.creatorId;
    }

    return false; // In Teams mode, only the game master advances the round
  })();

  return (
    <>
      {bonusTurn && (
        <CenteredRow>
          <div>
            {t("viewscore.catching_up", { scoringteam: scoringTeamString }) as string}
          </div>
          <Info>{t("viewscore.catching_up_info") as string}</Info>
        </CenteredRow>
      )}
      {gameState.gameType === GameType.Teams && nextClueGiverName && (
        <CenteredRow>
          <div>
            {t("viewscore.next_clue_giver", { givername: nextClueGiverName }) as string}
          </div>
        </CenteredRow>
      )}
      {gameState.gameType === GameType.Teams
        ? localPlayer.id === gameState.creatorId && (
            <Button
              text={t("viewscore.next_round") as string}
              onClick={() =>
                setGameState(
                  NewRound(localPlayer.id, gameState, cardsTranslation.t)
                )
              }
            />
          )
        : eligibleToDraw && (
            <Button
              text={t("viewscore.draw_next_card") as string}
              onClick={() =>
                setGameState(
                  NewRound(localPlayer.id, gameState, cardsTranslation.t)
                )
              }
            />
          )}
    </>
  );
}
