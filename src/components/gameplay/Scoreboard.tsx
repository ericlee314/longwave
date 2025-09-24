import React, { useState, useContext } from "react";
import { GameType, Team, TeamName } from "../../state/GameState";
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

  const style = {
    borderTop: "1px solid black",
    margin: 16,
    paddingTop: 16,
    alignItems: "center",
  };

  if (gameState.gameType === GameType.Freeplay) {
    return (
      <CenteredColumn style={style}>
        <em>{t("scoreboard.free_play") as string}</em>
        <CenteredRow style={{ flexWrap: "wrap" }}>
          {Object.keys(gameState.players).map((playerId) => (
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
          {Object.keys(gameState.players).map((playerId) => (
            <PlayerRow key={playerId} playerId={playerId} />
          ))}
        </CenteredRow>
      </CenteredColumn>
    );
  }

  return (
    <CenteredRow style={style}>
      <TeamColumn team={Team.Left} score={gameState.leftScore} />
      <TeamColumn team={Team.Right} score={gameState.rightScore} />
    </CenteredRow>
  );
}

function TeamColumn(props: { team: Team; score: number }) {
  const { t } = useTranslation();
  const { gameState, setGameState, localPlayer } = useContext(GameModelContext);

  const members = Object.keys(gameState.players).filter(
    (playerId) => gameState.players[playerId].team === props.team
  );

  const isGameMaster = localPlayer.id === gameState.creatorId;

  const adjustScore = (delta: number) => {
    if (!isGameMaster || gameState.gameType !== GameType.Teams) return;
    const key = props.team === Team.Left ? "leftScore" : "rightScore";
    const current = (gameState as any)[key] as number;
    // Clamp between 0 and 10
    const next = Math.max(0, Math.min(10, current + delta));
    if (next !== current) {
      setGameState({ [key]: next } as any);
    }
  };

  const subtleButtonStyle: React.CSSProperties = {
    marginLeft: 6,
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
        style={{ display: "flex", alignItems: "center" }}
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
        {TeamName(props.team, t, gameState)}: <AnimatableScore score={props.score} /> {t("scoreboard.points") as string}
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
  const { gameState, setGameState } = useContext(GameModelContext);
  const player = gameState.players[props.playerId];
  const [hovered, setHovered] = useState(false);

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
      {hovered ? (
        <div
          style={{
            ...iconContainerStyle,
            cursor: "pointer",
          }}
          onClick={() => {
            delete gameState.players[props.playerId];
            setGameState(gameState);
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
