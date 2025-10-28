import React, { useRef, useContext, useState } from "react";

import { GameType, RoundPhase, Team } from "../../state/GameState";
import { Spectrum } from "../common/Spectrum";
import { CenteredColumn, CenteredRow } from "../common/LayoutElements";
import { Button } from "../common/Button";
import { GameModelContext } from "../../state/GameModelContext";
import { RandomSpectrumTarget } from "../../state/RandomSpectrumTarget";
import { Info } from "../common/Info";
import { Animate } from "../common/Animate";
import { useTranslation } from "react-i18next";

export function GiveClue() {
  const { t } = useTranslation();
  const {
    gameState,
    localPlayer,
    clueGiver,
    spectrumCard,
    setGameState,
  } = useContext(GameModelContext);
  const isGameMaster = localPlayer.id === gameState.creatorId;

  const redrawCard = () =>
    setGameState({
      deckIndex: gameState.deckIndex + 1,
      spectrumTarget: RandomSpectrumTarget(),
    });

  const skipPlayer = () => {
    if (!clueGiver || gameState.gameType !== GameType.Teams) {
      return;
    }

    const playerIds = Object.keys(gameState.players);
    const leftTeamPlayers = (gameState.leftTeamOrder && gameState.leftTeamOrder.length
      ? gameState.leftTeamOrder
      : playerIds
    ).filter((pid) => gameState.players[pid].team === Team.Left);
    const rightTeamPlayers = (gameState.rightTeamOrder && gameState.rightTeamOrder.length
      ? gameState.rightTeamOrder
      : playerIds
    ).filter((pid) => gameState.players[pid].team === Team.Right);

    let nextClueGiverId = clueGiver.id;
    let nextLeftRotationIndex = gameState.leftRotationIndex || 0;
    let nextRightRotationIndex = gameState.rightRotationIndex || 0;

    if (clueGiver.team === Team.Left && leftTeamPlayers.length > 0) {
      const idx = leftTeamPlayers.length
        ? nextLeftRotationIndex % leftTeamPlayers.length
        : 0;
      nextClueGiverId = leftTeamPlayers[idx];
      nextLeftRotationIndex = leftTeamPlayers.length
        ? (idx + 1) % leftTeamPlayers.length
        : 0;
    } else if (clueGiver.team === Team.Right && rightTeamPlayers.length > 0) {
      const idx = rightTeamPlayers.length
        ? nextRightRotationIndex % rightTeamPlayers.length
        : 0;
      nextClueGiverId = rightTeamPlayers[idx];
      nextRightRotationIndex = rightTeamPlayers.length
        ? (idx + 1) % rightTeamPlayers.length
        : 0;
    }

    setGameState({
      clueGiver: nextClueGiverId,
      deckIndex: gameState.deckIndex + 1,
      spectrumTarget: RandomSpectrumTarget(),
      clue: "",
      leftRotationIndex: nextLeftRotationIndex,
      rightRotationIndex: nextRightRotationIndex,
      roundPhase: RoundPhase.GiveClue,
    });
  };
  const inputElement = useRef<HTMLInputElement>(null);
  const [disableSubmit, setDisableSubmit] = useState(
    !inputElement.current?.value?.length
  );

  if (!clueGiver) {
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

    if (eligiblePlayers.length === 0) {
      return (
        <CenteredColumn>
          <div>{t("makeguess.invite_other_players")}</div>
          <div>
            {t("makeguess.share_game_url", {
              game_url: window.location.href,
            })}
          </div>
        </CenteredColumn>
      );
    }

    setGameState({
      clueGiver: eligiblePlayers[0],
    });
    return null;
  }

  if (localPlayer.id !== clueGiver.id) {
    return (
      <div>
        <Animate animation="wipe-reveal-right">
          <Spectrum spectrumCard={spectrumCard} />
        </Animate>
        <CenteredColumn>
          <div>
            {t("giveclue.waiting_for_clue", { givername: clueGiver.name })}
          </div>
        </CenteredColumn>
        {gameState.gameType !== GameType.Cooperative && isGameMaster ? (
          <CenteredColumn style={{ alignItems: "flex-end" }}>
            <Button text={t("giveclue.draw_other_hand") as string} onClick={redrawCard} />
            {gameState.gameType === GameType.Teams && (
              <Button text={t("giveclue.skip_player") as string} onClick={skipPlayer} />
            )}
          </CenteredColumn>
        ) : null}
      </div>
    );
  }

  const submit = () => {
    if (!inputElement.current?.value?.length) {
      return false;
    }

    setGameState({
      clue: inputElement.current.value,
      guess: 10,
      roundPhase: RoundPhase.MakeGuess,
    });
  };

  return (
    <div>
      <div
        style={{
          background: "#fff3cd",
          border: "1px solid #ffeeba",
          color: "#856404",
          padding: "12px 16px",
          borderRadius: 4,
          margin: "12px 0",
          fontWeight: 600,
          textAlign: "center",
        }}
      >
        {t("giveclue.helper") as string}
      </div>
      {gameState.gameType !== GameType.Cooperative && isGameMaster ? (
        <CenteredColumn style={{ alignItems: "flex-end" }}>
          <Button text={t("giveclue.draw_other_hand") as string} onClick={redrawCard} />
          {gameState.gameType === GameType.Teams && (
            <Button text={t("giveclue.skip_player") as string} onClick={skipPlayer} />
          )}
        </CenteredColumn>
      ) : null}
      <Animate animation="wipe-reveal-right">
        <Spectrum
          targetValue={gameState.spectrumTarget}
          spectrumCard={spectrumCard}
        />
      </Animate>
      <CenteredColumn>
        <CenteredRow>
          <input
            type="text"
            placeholder={t("giveclue.clue") as string}
            ref={inputElement}
            onKeyDown={(event) => {
              if (event.key !== "Enter") {
                return true;
              }
              submit();
            }}
            onChange={() =>
              setDisableSubmit(!inputElement.current?.value?.length)
            }
          />
          <Info>
            <div>
              {t("giveclue.instructions") as string}
              <ul>
                <li>{t("giveclue.focus1") as string}</li>
                <li>{t("giveclue.focus2") as string}</li>
                <li>{t("giveclue.focus3") as string}</li>
                <li>{t("giveclue.focus4") as string}</li>
              </ul>
            </div>
          </Info>
        </CenteredRow>
        <Button
          text={t("giveclue.give_clue") as string}
          onClick={submit}
          disabled={disableSubmit}
        />
      </CenteredColumn>
    </div>
  );
}
