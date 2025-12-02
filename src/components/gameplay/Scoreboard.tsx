import React, { useState, useContext } from "react";
import { DEFAULT_POINTS_TO_WIN, GameType, Team, TeamName } from "../../state/GameState";
import { CenteredRow, CenteredColumn } from "../common/LayoutElements";
import { GameModelContext } from "../../state/GameModelContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimesCircle } from "@fortawesome/free-solid-svg-icons";
import { Animate } from "../common/Animate";
import { useRef } from "react";
import { useEffect } from "react";

import { useTranslation } from "react-i18next";

export function Scoreboard() {
  const { t } = useTranslation();
  const { gameState } = useContext(GameModelContext);
  const pointsToWin = gameState.pointsToWin ?? DEFAULT_POINTS_TO_WIN;

  const style = {
    borderTop: "1px solid black",
    margin: 16,
    paddingTop: 16,
    alignItems: "center",
    width: "100%",
  };

  // Maintain consistent player ordering using explicit team orders if available
  const leftBase = new Set(gameState.leftTeamOrder || []);
  const rightBase = new Set(gameState.rightTeamOrder || []);
  const orderedPlayerIds = [
    ...[...(gameState.leftTeamOrder || [])].filter((pid) => gameState.players[pid]?.team === Team.Left),
    ...[...(gameState.rightTeamOrder || [])].filter((pid) => gameState.players[pid]?.team === Team.Right),
    ...Object.keys(gameState.players).filter((pid) => !leftBase.has(pid) && !rightBase.has(pid)),
  ];

  if (gameState.gameType === GameType.Freeplay) {
    return (
      <CenteredColumn style={style}>
        <em>{t("scoreboard.free_play") as string}</em>
        <CenteredRow style={{ flexWrap: "wrap" }}>
          {orderedPlayerIds.map((playerId) => (
            <PlayerRow key={playerId} playerId={playerId} />
          ))}
        </CenteredRow>
      </CenteredColumn>
    );
  }

  if (gameState.gameType === GameType.Cooperative) {
    const cardsRemaining = 7 + gameState.coopBonusTurns - gameState.turnsTaken;
    return (
      <CenteredColumn style={style}>
        <em>
          {t("scoreboard.coop_score") as string}: {gameState.coopScore}{" "}
          {t("scoreboard.points") as string}
        </em>
        <div>
          {cardsRemaining === 0
            ? t("scoreboard.last_card")
            : t("scoreboard.card_remaining") + ": " + cardsRemaining}
        </div>
        <CenteredRow style={{ flexWrap: "wrap" }}>
          {orderedPlayerIds.map((playerId) => (
            <PlayerRow key={playerId} playerId={playerId} />
          ))}
        </CenteredRow>
      </CenteredColumn>
    );
  }

  return (
    <CenteredColumn style={style}>
      <div style={{ fontSize: 14, color: "#555", marginBottom: 8 }}>
        {t("scoreboard.playing_to", { points: pointsToWin }) as string}
      </div>
      <CenteredRow style={{ width: "100%" }}>
        <TeamColumn
          team={Team.Left}
          score={gameState.leftScore}
          orderedPlayerIds={orderedPlayerIds}
        />
        <TeamColumn
          team={Team.Right}
          score={gameState.rightScore}
          orderedPlayerIds={orderedPlayerIds}
        />
      </CenteredRow>
    </CenteredColumn>
  );
}

function TeamColumn(props: { team: Team; score: number; orderedPlayerIds: string[] }) {
  const { t } = useTranslation();
  const { gameState, setGameState, localPlayer } = useContext(GameModelContext);

  const explicitOrder = props.team === Team.Left ? gameState.leftTeamOrder : gameState.rightTeamOrder;
  const explicitFiltered = (explicitOrder || []).filter((pid) => gameState.players[pid]?.team === props.team);
  const members = (explicitFiltered.length ? explicitFiltered : props.orderedPlayerIds).filter(
    (playerId) => gameState.players[playerId].team === props.team
  );

  const isGameMaster = localPlayer.id === gameState.creatorId;

  const adjustScore = (delta: number) => {
    if (!isGameMaster || gameState.gameType !== GameType.Teams) return;
    const key = props.team === Team.Left ? "leftScore" : "rightScore";
    const current = (gameState as any)[key] as number;
    const maxScore = gameState.pointsToWin ?? DEFAULT_POINTS_TO_WIN;
    // Clamp between 0 and the configured win condition
    const next = Math.max(0, Math.min(maxScore, current + delta));
    if (next !== current) {
      setGameState({ [key]: next } as any);
    }
  };

  const subtleButtonStyle: React.CSSProperties = {
    marginLeft: 0,
    padding: "0 6px",
    borderRadius: 4,
    border: "1px solid rgba(0,0,0,0.15)",
    background: "rgba(0,0,0,0.03)",
    cursor: isGameMaster ? "pointer" : "default",
    opacity: isGameMaster ? 0.55 : 0,
    transition: "opacity 0.2s ease",
    userSelect: "none",
  };

  return (
    <CenteredColumn style={{ alignItems: "flex-start" }}>
      <div
        style={{ display: "flex", alignItems: "center", gap: 4 }}
        onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
          const container = e.currentTarget;
          Array.from(container.querySelectorAll("button.gm-adjust")).forEach(
            (el) => ((el as HTMLButtonElement).style.opacity = isGameMaster ? "0.55" : "0")
          );
        }}
        onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
          const container = e.currentTarget;
          Array.from(container.querySelectorAll("button.gm-adjust")).forEach(
            (el) => ((el as HTMLButtonElement).style.opacity = "0")
          );
        }}
      >
        {TeamName(props.team, t, gameState)}:
        <span style={{ fontWeight: 700 }}>
          <AnimatableScore score={props.score} />
        </span>
        {props.score === 1 ? (t("scoreboard.point") as string) : (t("scoreboard.points") as string)}
        <button
          type="button"
          className="gm-adjust"
          style={subtleButtonStyle}
          aria-label="Decrease score"
          title={isGameMaster ? "Decrease score" : undefined}
          onClick={() => adjustScore(-1)}
          disabled={!isGameMaster}
        >
          −
        </button>
        <button
          type="button"
          className="gm-adjust"
          style={subtleButtonStyle}
          aria-label="Increase score"
          title={isGameMaster ? "Increase score" : undefined}
          onClick={() => adjustScore(1)}
          disabled={!isGameMaster}
        >
          +
        </button>
      </div>
      {members.map((playerId) => (
        <PlayerRow key={playerId} playerId={playerId} />
      ))}
    </CenteredColumn>
  );
}

function AnimatableScore(props: { score: number }) {
  const lastScore = useRef(props.score);

  useEffect(() => {
    lastScore.current = props.score;
  }, [props.score]);

  if (props.score - lastScore.current === 0) {
    return <span>{props.score}</span>;
  }

  const delta = props.score - lastScore.current;

  return (
    <span style={{ position: "relative" }}>
      {props.score}
      <Animate
        animation="fade-disappear-up"
        style={{
          position: "absolute",
          fontSize: "small",
          top: -16,
          right: 0,
        }}
      >
        {delta > 0 ? `+${delta}` : `${delta}`}
      </Animate>
    </span>
  );
}

// (helper removed; inline mapping used to avoid prop type conflicts for 'key')

function PlayerRow(props: { playerId: string }) {
  const { gameState, setGameState, localPlayer } = useContext(GameModelContext);
  const player = gameState.players[props.playerId];
  const [hovered, setHovered] = useState(false);
  const isGameMaster = localPlayer.id === gameState.creatorId;

  const iconContainerStyle = {
    marginLeft: 4,
    width: 20,
  };

  return (
    <div
      style={{ marginLeft: 16, display: "flex", flexFlow: "row" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {player.name}
      {hovered && isGameMaster ? (
        <div
          style={{
            ...iconContainerStyle,
            cursor: isGameMaster ? "pointer" : "default",
          }}
          onClick={() => {
            if (!isGameMaster) return;
            const next = { ...gameState };
            delete next.players[props.playerId];
            next.leftTeamOrder = (next.leftTeamOrder || []).filter((pid) => pid !== props.playerId);
            next.rightTeamOrder = (next.rightTeamOrder || []).filter((pid) => pid !== props.playerId);
            setGameState(next);
          }}
        >
          <FontAwesomeIcon icon={faTimesCircle} />
        </div>
      ) : (
        <div style={iconContainerStyle} />
      )}
    </div>
  );
}
