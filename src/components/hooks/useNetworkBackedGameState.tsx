import { useState, useEffect } from "react";
import firebase from "firebase/app";
import "firebase/database";
import { GameState, InitialGameState, Team } from "../../state/GameState";
import { useTranslation } from "react-i18next";

export function useNetworkBackedGameState(
  roomId: string,
  playerId: string,
  playerName: string
): [GameState, (newState: Partial<GameState>) => void] {
  const { i18n } = useTranslation("spectrum-cards");
  const [gameState, setGameState] = useState<GameState>(
    InitialGameState(i18n.language)
  );

  useEffect(() => {
    const dbRef = firebase.database().ref("rooms/" + roomId);

    dbRef.on("value", (appState) => {
      const networkGameState: GameState = appState.val();
      const completeGameState = {
        ...InitialGameState(i18n.language),
        ...networkGameState,
      };

      if (networkGameState?.roundPhase === undefined) {
        dbRef.set({
          ...completeGameState,
          creatorId:
            completeGameState.creatorId && completeGameState.creatorId.length
              ? completeGameState.creatorId
              : playerId,
        });
        return;
      }

      if (completeGameState.players[playerId] === undefined) {
        completeGameState.players[playerId] = {
          name: playerName,
          team: Team.Unset,
        };
        // Ensure order arrays exist
        completeGameState.leftTeamOrder = completeGameState.leftTeamOrder || [];
        completeGameState.rightTeamOrder = completeGameState.rightTeamOrder || [];
        dbRef.set(completeGameState);
        return;
      }

      setGameState(completeGameState);
    });
    return () => dbRef.off();
  }, [playerId, playerName, roomId, i18n]);

  const dbRef = firebase.database().ref("rooms/" + roomId);

  return [
    gameState,
    (newState: Partial<GameState>) => {
      dbRef.set({
        ...gameState,
        ...newState,
      });
    },
  ];
}
