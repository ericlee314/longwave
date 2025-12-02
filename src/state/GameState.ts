import { RandomSpectrumTarget } from "./RandomSpectrumTarget";
import { RandomFourCharacterString } from "./RandomFourCharacterString";
import { TFunction } from "i18next";

export enum RoundPhase {
  SetupGame,
  PickTeams,
  GiveClue,
  MakeGuess,
  CounterGuess,
  ViewScore,
}

export enum GameType {
  Teams,
  Cooperative,
  Freeplay,
}

export enum Team {
  Unset,
  Left,
  Right,
}

export function TeamReverse(team: Team) {
  if (team === Team.Left) {
    return Team.Right;
  }
  if (team === Team.Right) {
    return Team.Left;
  }
  return Team.Unset;
}

export function TeamName(team: Team, t: TFunction<string>, gameState: GameState) {
  if (team === Team.Left) {
    return gameState.leftTeamName && gameState.leftTeamName.trim().length > 0
      ? gameState.leftTeamName
      : t("gamestate.left_brain");
  }
  if (team === Team.Right) {
    return gameState.rightTeamName && gameState.rightTeamName.trim().length > 0
      ? gameState.rightTeamName
      : t("gamestate.right_brain");
  }
  return t("gamestate.the_player");
}

export type PlayersTeams = {
  [playerId: string]: {
    name: string;
    team: Team;
  };
};

export type TurnSummaryModel = {
  spectrumCard: [string, string];
  clueGiverName: string;
  clue: string;
  spectrumTarget: number;
  guess: number;
};

export const DEFAULT_POINTS_TO_WIN = 15;

export interface GameState {
  gameType: GameType;
  roundPhase: RoundPhase;
  turnsTaken: number;
  deckSeed: string;
  deckIndex: number;
  spectrumTarget: number;
  clue: string;
  guess: number;
  counterGuess: "left" | "right";
  players: PlayersTeams;
  clueGiver: string;
  leftScore: number;
  rightScore: number;
  coopScore: number;
  coopBonusTurns: number;
  previousTurn: TurnSummaryModel | null;
  deckLanguage: string | null;
  creatorId: string;
  leftTeamName: string;
  rightTeamName: string;
  // Rotation indices for selecting the next clue giver within each team
  leftRotationIndex: number;
  rightRotationIndex: number;
  // Explicit, stable ordering of players within each team
  leftTeamOrder: string[];
  rightTeamOrder: string[];
  // Target score required to win a standard teams game
  pointsToWin: number;
}

export function InitialGameState(deckLanguage: string = "en"): GameState {
  return {
    gameType: GameType.Teams,
    roundPhase: RoundPhase.SetupGame,
    turnsTaken: -1,
    deckSeed: RandomFourCharacterString(),
    deckIndex: 0,
    spectrumTarget: RandomSpectrumTarget(),
    clue: "",
    guess: 0,
    counterGuess: "left",
    players: {},
    clueGiver: "",
    leftScore: 0,
    rightScore: 0,
    coopScore: 0,
    coopBonusTurns: 0,
    previousTurn: null,
    deckLanguage: deckLanguage,
    creatorId: "",
    leftTeamName: "",
    rightTeamName: "",
    leftRotationIndex: 0,
    rightRotationIndex: 0,
    leftTeamOrder: [],
    rightTeamOrder: [],
    pointsToWin: DEFAULT_POINTS_TO_WIN,
  };
}
