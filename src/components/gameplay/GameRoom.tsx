import { useParams } from "react-router-dom";
import React, { useEffect } from "react";
import { useStorageBackedState } from "../hooks/useStorageBackedState";
import { useNetworkBackedGameState } from "../hooks/useNetworkBackedGameState";
import { InputName } from "./InputName";
import { RandomFourCharacterString } from "../../state/RandomFourCharacterString";
import { GameModelContext } from "../../state/GameModelContext";
import { ActiveGame } from "./ActiveGame";
import { BuildGameModel } from "../../state/BuildGameModel";
import { RoomIdHeader } from "../common/RoomIdHeader";
import { FakeRooms } from "./FakeRooms";
import { useTranslation } from "react-i18next";
import { GameType, RoundPhase, Team } from "../../state/GameState";

export function GameRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  if (roomId === undefined) {
    throw new Error("RoomId missing");
  }

  const [playerName, setPlayerName] = useStorageBackedState("", "name");

  const [playerId] = useStorageBackedState(
    RandomFourCharacterString(),
    "playerId"
  );

  const [gameState, setGameState] = useNetworkBackedGameState(
    roomId,
    playerId,
    playerName
  );

  const cardsTranslation = useTranslation("spectrum-cards");

  if (
    gameState.deckLanguage !== null &&
    cardsTranslation.i18n.language !== gameState.deckLanguage
  ) {
    cardsTranslation.i18n.changeLanguage(gameState.deckLanguage);
    return null;
  }

  if (roomId === "MULTIPLAYER_TEST") {
    return <FakeRooms />;
  }

  const gameModel = BuildGameModel(
    gameState,
    setGameState,
    playerId,
    cardsTranslation.t,
    setPlayerName
  );

  if (playerName.length === 0) {
    return (
      <InputName
        setName={(name) => {
          setPlayerName(name);
          gameState.players[playerId].name = name;
          setGameState(gameState);
        }}
      />
    );
  }

  const searchParams = new URLSearchParams(window.location.search);
  if (searchParams.get("rocketcrab")) {
    const rocketcrabPlayerName = searchParams.get("name");
    if (rocketcrabPlayerName !== null && rocketcrabPlayerName !== playerName) {
      setPlayerName(rocketcrabPlayerName);
    }
  }

  if (!gameState?.players?.[playerId]) {
    return null;
  }

  // Toggle page border based on which team is currently acting
  useEffect(() => {
    const body = document.body;
    const clear = () => body.classList.remove("left-acting", "right-acting");
    clear();
    try {
      if (gameState.gameType !== GameType.Teams) return;
      const phase = gameState.roundPhase;
      const isActingPhase =
        phase === RoundPhase.GiveClue ||
        phase === RoundPhase.MakeGuess ||
        phase === RoundPhase.CounterGuess;
      if (!isActingPhase) return;
      const clueGiverId = gameState.clueGiver;
      const clueGiver = gameState.players[clueGiverId];
      if (!clueGiver) return;
      let actingTeam = clueGiver.team;
      if (phase === RoundPhase.CounterGuess) {
        actingTeam = actingTeam === Team.Left ? Team.Right : actingTeam === Team.Right ? Team.Left : Team.Unset;
      }
      if (actingTeam === Team.Left) {
        body.classList.add("left-acting");
      } else if (actingTeam === Team.Right) {
        body.classList.add("right-acting");
      }
    } finally {
      // no-op
    }
    return clear;
  }, [gameState]);

  return (
    <GameModelContext.Provider value={gameModel}>
      <RoomIdHeader />
      <ActiveGame />
    </GameModelContext.Provider>
  );
}
