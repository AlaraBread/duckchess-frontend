import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import useWebSocket from "react-use-websocket";

export type FloorType = "light" | "dark";

export type PieceType =
	| { type: "queen" }
	| { type: "king"; hasCastled: boolean }
	| { type: "castle" }
	| { type: "bishop" }
	| { type: "knight" }
	| { type: "pawn"; hasMoved: boolean };

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
	whitePlayer: number;
	blackPlayer: number;
	board: Tile[][];
}

export interface GameData {
	players: Set<number>;
	listeningPlayers: Set<number>;
	board: Board | null;
	chat: string[];
}

export type Player = "white" | "black";

export interface Move {
	moveType: MoveType;
	from: [number, number];
	to: [number, number];
}

type MoveType = "jumpingMove" | "slidingMove";

type WebsocketEvent =
	| { type: "selfInfo"; id: number }
	| { type: "playerAdded"; id: number }
	| { type: "playerRemoved"; id: number }
	| { type: "playerJoined"; id: number }
	| { type: "playerLeft"; id: number }
	| { type: "move"; moves: Move[] }
	| { type: "gameState"; state: GameData }
	| {
			type: "turnStart";
			turn: Player;
			movePieces: [number, number][];
			moves: [number, number][][];
	  }
	| { type: "chatMessage"; id: number; message: string }
	| { type: "end"; winner: Player };

export function useMatch() {
	const findMatch = useMutation({
		mutationFn: () =>
			fetch("http://localhost:8000/play/find_match", {
				method: "POST",
				credentials: "include",
			}).then((response) => response.json() as Promise<number>),
	});
	const gameId = findMatch.data;
	const [hasFired, setHasFired] = useState(false);
	useEffect(() => {
		if (!hasFired) {
			findMatch.mutate();
			setHasFired(true);
		}
	}, [hasFired, findMatch]);
	const [gameData, setGameData] = useState<GameData | undefined>(undefined);
	const [ownId, setOwnId] = useState<number | undefined>(undefined);
	const [moves, setMoves] = useState<
		| {
				turn: Player;
				pieces: [number, number][];
				moves: [number, number][][];
		  }
		| undefined
	>(undefined);
	const [boardAnimations, setBoardAnimations] = useState<Move[]>();
	const player: Player =
		ownId == gameData?.board?.whitePlayer ? "white" : "black";
	const [websocketError, setWebsocketError] = useState<string | undefined>(
		undefined,
	);
	const { sendJsonMessage } = useWebSocket(
		`http://localhost:8000/play/${gameId}`,
		{
			onOpen: () => {
				setWebsocketError(undefined);
			},
			onClose: (event) => {
				setWebsocketError(event.reason);
				setGameData(undefined);
				setMoves(undefined);
			},
			onError: (error) => {
				console.log("websocket error: ", error);
				setWebsocketError("websocket error");
				setGameData(undefined);
				setMoves(undefined);
			},
			onMessage: (event) => {
				const data: WebsocketEvent = JSON.parse(event.data);
				console.log(data);
				switch (data.type) {
					case "gameState":
						data.state.listeningPlayers = new Set(
							data.state.listeningPlayers,
						);
						data.state.players = new Set(data.state.players);
						data.state.chat = [];
						setGameData(data.state);
						break;
					case "selfInfo":
						setOwnId(data.id);
						break;
					case "playerAdded":
						if (gameData != undefined) {
							gameData.players.add(data.id);
							setGameData({ ...gameData });
						}
						break;
					case "playerRemoved":
						if (gameData != undefined) {
							gameData.players.delete(data.id);
							setGameData({ ...gameData });
						}
						break;
					case "playerJoined":
						if (gameData != undefined) {
							gameData.listeningPlayers.add(data.id);
							setGameData({ ...gameData });
						}
						break;
					case "playerLeft":
						if (gameData != undefined) {
							gameData.listeningPlayers.delete(data.id);
							setGameData({ ...gameData });
						}
						break;
					case "turnStart":
						setMoves({
							turn: data.turn,
							moves: data.moves,
							pieces: data.movePieces,
						});
						break;
					case "move":
						setBoardAnimations(data.moves);
						break;
					case "chatMessage":
						if (gameData != undefined) {
							gameData.chat.push(data.message);
							gameData.chat = [...gameData.chat];
							setGameData({ ...gameData });
						}
						break;
					default:
						console.log("unknown server message: ", data);
						break;
				}
			},
		},
		gameId != undefined,
	);
	console.log("gamedata: ", gameData);
	console.log("moves: ", moves);
	return {
		findMatch: findMatch.mutate,
		gameId,
		error: findMatch.error?.message || websocketError,
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
		boardAnimations,
		setBoardAnimations,
		applyMove(move: Move) {
			if (gameData && gameData.board) {
				const from = move.from;
				const to = move.to;
				gameData.board.board[to[1]][to[0]].piece =
					gameData.board.board[from[1]][from[0]].piece;
				gameData.board.board[from[1]][from[0]].piece = undefined;
				setGameData({ ...gameData });
			}
		},
	};
}
