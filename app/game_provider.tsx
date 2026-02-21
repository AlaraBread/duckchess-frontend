import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createContext, useContext, useState } from "react";
import useWebSocket from "react-use-websocket";
import { rotateBoard, rotateMove, rotateMoves } from "./util";

export type FloorType = "light" | "dark";

type Writeable<T> = { -readonly [P in keyof T]: T[P] };

export type PieceType = Writeable<(typeof pieceTypes)[number]>;

export const pieceTypes = [
	{ type: "queen" },
	{ type: "king" },
	{ type: "castle" },
	{ type: "bishop" },
	{ type: "knight" },
	{ type: "pawn" },
] as const;

export interface Piece {
	pieceType: PieceType;
	owner: Player;
}

export interface Tile {
	floor: FloorType;
	piece: Piece | undefined;
}

export interface Board {
	turn: Player;
	whitePlayer: UserId;
	blackPlayer: UserId;
	board: Tile[][];
}

export interface GameData {
	board: Board;
	chat: ChatMessage[];
	clock: ChessClock;
}

export type ChessClock = Record<Player, Timer>;

export type Timer =
	| {
			type: "paused";
			timeRemaining: number;
	  }
	| { type: "running"; endTime: number };

export type Player = "white" | "black";

export type Vec2 = [number, number];

export interface Move {
	moveType: MoveType;
	from: Vec2;
	to: Vec2;
}

export type MoveType =
	| { type: "jumpingMove" }
	| { type: "slidingMove" }
	| { type: "promotion"; into: PieceType };

export interface Moves {
	turn: Player;
	pieces: Vec2[];
	moves: Move[][];
}

type UserId = string;

type WebsocketEvent =
	| { type: "selfInfo"; id: UserId }
	| {
			type: "gameState";
			board: Board & { moves: Move[][]; movePieces: Vec2[] };
			clock: ChessClock;
	  }
	| {
			type: "turnStart";
			turn: Player;
			movePieces: Vec2[];
			moves: Move[][];
			clock: ChessClock;
	  }
	| { type: "chatMessage"; message: ChatMessage }
	| { type: "move"; moves: Move[] }
	| { type: "fullChat"; id: number; chat: ChatMessage[] }
	| { type: "end"; winner: UserId };

export interface ChatMessage {
	id: UserId;
	message: string;
}

const GameContext = createContext<GameContext | undefined>(undefined);

interface GameContext {
	error: string | undefined;
	gameData: GameData | undefined;
	sendChatMessage: (message: string) => void;
	moves: Moves | undefined;
	sendTurn: (pieceIdx: number, moveIdx: number) => void;
	player: Player;
	turn: Player | undefined;
	winner: boolean | undefined;
	boardAnimations: Move[] | undefined;
	setBoardAnimations: (boardAnimations: Move[] | undefined) => void;
	applyMove: (move: Move) => void;
	resetGame: () => void;
	surrender: () => void;
	setShouldConnect: (shouldConnect: boolean) => void;
}

export const API_URL = "https://api.alarabread.fun:80/duckchess";

export function GameProvider({ children }: { children: React.ReactNode }) {
	const login = useQuery({
		queryKey: ["login"],
		queryFn: () =>
			fetch(`${API_URL}/login`, {
				method: "GET",
				credentials: "include",
			}).then((response) => response.json() as Promise<UserId>),
	});
	const [gameData, setGameData] = useState<GameData | undefined>(undefined);
	const [moves, setMoves] = useState<Moves | undefined>(undefined);
	const [boardAnimations, setBoardAnimations] = useState<
		Move[] | undefined
	>();
	const player: Player =
		login.data == gameData?.board?.whitePlayer ? "white" : "black";
	const [websocketError, setWebsocketError] = useState<string | undefined>(
		undefined,
	);
	const [shouldConnect, setShouldConnect] = useState(false);
	const [winner, setWinner] = useState<undefined | UserId>(undefined);
	const { sendJsonMessage } = useWebSocket(
		API_URL,
		{
			onOpen: () => {
				setWebsocketError(undefined);
				const rawSetup = localStorage.getItem("boardSetup");
				if (!rawSetup) {
					router.push("/board-setup");
					return;
				}
				const setup: (PieceType | undefined)[][] = JSON.parse(rawSetup);
				sendJsonMessage({ type: "boardSetup", setup });
			},
			onClose: (event) => {
				setWebsocketError(event.reason);
				if (winner == undefined) {
					setGameData(undefined);
					setMoves(undefined);
				}
			},
			onError: (error) => {
				console.log("websocket error: ", error);
				setWebsocketError("websocket error");
				setGameData(undefined);
				setMoves(undefined);
				setShouldConnect(false);
			},
			onMessage: (event) => {
				const data: WebsocketEvent = JSON.parse(event.data);
				console.log("got message: ", data);
				switch (data.type) {
					case "gameState":
						const dataPlayer =
							data.board.whitePlayer == login.data
								? "white"
								: "black";
						setGameData({
							chat: gameData?.chat ?? [],
							board: rotateBoard(dataPlayer, data.board),
							clock: data.clock,
						});
						setMoves(
							rotateMoves(dataPlayer, {
								turn: data.board.turn,
								moves: data.board.moves,
								pieces: data.board.movePieces,
							}),
						);
						break;
					case "turnStart":
						if (!gameData) break;
						setGameData({ ...gameData, clock: data.clock });
						setMoves(
							rotateMoves(player, {
								turn: data.turn,
								moves: data.moves,
								pieces: data.movePieces,
							}),
						);
						break;
					case "move":
						setBoardAnimations(
							data.moves
								.filter((move) => move.from[0] >= 0)
								.map(rotateMove.bind(undefined, player)),
						);
						break;
					case "end":
						setShouldConnect(false);
						setWinner(data.winner);
						break;
					case "chatMessage":
						if (gameData != undefined) {
							gameData.chat.push(data.message);
							gameData.chat = [...gameData.chat];
							setGameData({ ...gameData });
						}
						break;
					case "fullChat":
						if (gameData != undefined) {
							gameData.chat = data.chat;
							setGameData({ ...gameData });
						}
						break;
					default:
						console.log("unknown server message: ", data);
						break;
				}
			},
		},
		login.data != undefined && shouldConnect,
	);
	const router = useRouter();
	const context: GameContext = {
		error: login.error?.message || websocketError,
		gameData: gameData,
		sendChatMessage(message: string) {
			sendJsonMessage({ type: "chatMessage", message });
		},
		moves: player == moves?.turn ? moves : undefined,
		sendTurn(pieceIdx: number, moveIdx: number) {
			setMoves(undefined);
			sendJsonMessage({ type: "turn", pieceIdx, moveIdx });
		},
		player,
		turn: moves?.turn,
		winner: winner == undefined ? undefined : winner == login.data,
		boardAnimations,
		setBoardAnimations,
		setShouldConnect,
		applyMove(move: Move) {
			if (gameData && gameData.board) {
				const from = move.from;
				const to = move.to;
				const piece = gameData.board.board[from[1]][from[0]].piece;
				gameData.board.board[to[1]][to[0]].piece = piece;
				if (from[0] != to[0] || from[1] != to[1]) {
					gameData.board.board[from[1]][from[0]].piece = undefined;
				}
				if (piece && move.moveType.type == "promotion") {
					piece.pieceType.type = move.moveType.into.type;
				}
				setGameData({ ...gameData });
			}
		},
		surrender() {
			setWinner(
				gameData?.board.whitePlayer == login.data
					? gameData?.board.blackPlayer
					: gameData?.board.whitePlayer,
			);
			sendJsonMessage({ type: "surrender" });
		},
		resetGame() {
			setShouldConnect(false);
			setWinner(undefined);
			setGameData(undefined);
			setMoves(undefined);
			setWebsocketError(undefined);
		},
	};
	return (
		<GameContext value={context}>
			<div>{children}</div>
		</GameContext>
	);
}

export function useGame() {
	const context = useContext(GameContext);
	if (!context) {
		throw new Error("useGame must be used within a GameProvider");
	}
	return context;
}
