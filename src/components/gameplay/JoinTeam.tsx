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

  // Build team lists: respect explicit order arrays, then append any missing members
  const leftTeamBase = new Set(gameState.leftTeamOrder || []);
  const rightTeamBase = new Set(gameState.rightTeamOrder || []);
  const leftTeamMissing: string[] = [];
  const rightTeamMissing: string[] = [];
  for (const pid of Object.keys(gameState.players)) {
    const p = gameState.players[pid];
    if (p?.team === Team.Left && !leftTeamBase.has(pid)) leftTeamMissing.push(pid);
    if (p?.team === Team.Right && !rightTeamBase.has(pid)) rightTeamMissing.push(pid);
  }
  const leftBaseArray = Array.from(leftTeamBase);
  const rightBaseArray = Array.from(rightTeamBase);
  const leftTeam: string[] = [
    ...leftBaseArray.filter((pid) => gameState.players[pid]?.team === Team.Left),
    ...leftTeamMissing,
  ];
  const rightTeam: string[] = [
    ...rightBaseArray.filter((pid) => gameState.players[pid]?.team === Team.Right),
    ...rightTeamMissing,
  ];

  const joinTeam = (team: Team) => {
    // Update player team assignment
    const nextPlayers = {
      ...gameState.players,
      [localPlayer.id]: {
        ...localPlayer,
        team,
      },
    };

    // Update explicit per-team order arrays to append the joining player at the bottom
    const leftTeamOrder = [...(gameState.leftTeamOrder || [])].filter(
      (pid) => pid !== localPlayer.id
    );
    const rightTeamOrder = [...(gameState.rightTeamOrder || [])].filter(
      (pid) => pid !== localPlayer.id
    );
    if (team === Team.Left) {
      leftTeamOrder.push(localPlayer.id);
    } else if (team === Team.Right) {
      rightTeamOrder.push(localPlayer.id);
    }

    setGameState({
      players: nextPlayers,
      leftTeamOrder,
      rightTeamOrder,
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
        <CenteredRow style={{ gap: 24, margin: "8px 0" }}>
          <div>
            <div>{t("jointeam.left_team_name") as string}</div>
            <input
              type="text"
              style={{ marginTop: 4 }}
              value={gameState.leftTeamName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setGameState({ leftTeamName: e.target.value })
              }
            />
          </div>
          <div>
            <div>{t("jointeam.right_team_name") as string}</div>
            <input
              type="text"
              style={{ marginTop: 4 }}
              value={gameState.rightTeamName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setGameState({ rightTeamName: e.target.value })
              }
            />
          </div>
        </CenteredRow>
      )}
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
          <div>{TeamName(Team.Left, t, gameState)}</div>
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
          <div>{TeamName(Team.Right, t, gameState)}</div>
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
