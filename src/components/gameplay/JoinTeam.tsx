import React from "react";
import { CenteredRow, CenteredColumn } from "../common/LayoutElements";
import { RoundPhase, Team, TeamName } from "../../state/GameState";
import { Button } from "../common/Button";
import { LongwaveAppTitle } from "../common/Title";
import { useContext } from "react";
import { GameModelContext } from "../../state/GameModelContext";
import { NewTeamGame } from "../../state/NewGame";

import { useTranslation } from "react-i18next";

export function JoinTeam() {
  const { t } = useTranslation();
  const cardsTranslation = useTranslation("spectrum-cards");
  const { gameState, localPlayer, setGameState } = useContext(GameModelContext);

  const leftTeam = Object.keys(gameState.players).filter(
    (playerId) => gameState.players[playerId].team === Team.Left
  );
  const rightTeam = Object.keys(gameState.players).filter(
    (playerId) => gameState.players[playerId].team === Team.Right
  );

  const joinTeam = (team: Team) => {
    setGameState({
      players: {
        ...gameState.players,
        [localPlayer.id]: {
          ...localPlayer,
          team,
        },
      },
    });
  };

  const isCreator = localPlayer.id === gameState.creatorId;

  const startGame = () =>
    localPlayer.id === gameState.creatorId &&
    setGameState(
      NewTeamGame(
        gameState.players,
        localPlayer.id,
        gameState,
        cardsTranslation.t
      )
    );

  return (
    <CenteredColumn>
      <LongwaveAppTitle />
      <div>{t("jointeam.join_team") as string}:</div>
      {isCreator && (
        <div style={{ maxWidth: 600, color: "#666", marginBottom: 8 }}>
          {t("jointeam.creator_is_observer")}
        </div>
      )}
      <CenteredRow
        style={{
          alignItems: "flex-start",
          alignSelf: "stretch",
        }}
      >
        <CenteredColumn>
          <div>{TeamName(Team.Left, t)}</div>
          {leftTeam.map((playerId) => (
            <div key={playerId}>{gameState.players[playerId].name}</div>
          ))}
          {!isCreator && (
            <div>
              <Button
                text={t("jointeam.join_left") as string}
                onClick={() => joinTeam(Team.Left)}
              />
            </div>
          )}
        </CenteredColumn>
        <CenteredColumn>
          <div>{TeamName(Team.Right, t)}</div>
          {rightTeam.map((playerId) => (
            <div key={playerId}>{gameState.players[playerId].name}</div>
          ))}
          {!isCreator && (
            <div>
              <Button
                text={t("jointeam.join_right") as string}
                onClick={() => joinTeam(Team.Right)}
              />
            </div>
          )}
        </CenteredColumn>
      </CenteredRow>
      {gameState.roundPhase === RoundPhase.PickTeams && (
        <>
          <Button
            text={t("jointeam.start_game") as string}
            onClick={startGame}
            disabled={localPlayer.id !== gameState.creatorId}
          />
          {localPlayer.id !== gameState.creatorId && (
            <div style={{ color: "#666", marginTop: 8 }}>
              {t("jointeam.only_creator_can_start") as string}
            </div>
          )}
        </>
      )}
    </CenteredColumn>
  );
}
