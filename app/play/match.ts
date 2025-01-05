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
	owner: number;
}

export interface Tile {
	floor: FloorType;
	piece: Piece | undefined;
}

export interface GameData {
	players: Set<number>;
	listeningPlayers: Set<number>;
	board: Tile[][];
	started: boolean;
	chat: string[];
}

type WebsocketEvent =
	| { type: "playerAdded"; id: number }
	| { type: "playerRemoved"; id: number }
	| { type: "playerJoined"; id: number }
	| { type: "playerLeft"; id: number }
	| { type: "turn" }
	| { type: "chatMessage"; id: number; message: string }
	| { type: "gameState"; state: GameData }
	| { type: "start" };

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
	const [websocketError, setWebsocketError] = useState<Event | undefined>(
		undefined,
	);
	const { sendJsonMessage } = useWebSocket(
		`http://localhost:8000/play/${gameId}`,
		{
			onOpen: () => {
				setWebsocketError(undefined);
			},
			onError: (error) => {
				setWebsocketError(error);
			},
			onMessage: (event) => {
				const data: WebsocketEvent = JSON.parse(event.data);
				switch (data.type) {
					case "gameState":
						data.state.listeningPlayers = new Set(
							data.state.listeningPlayers,
						);
						data.state.players = new Set(data.state.players);
						data.state.chat = [];
						setGameData(data.state);
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
					case "start":
						if (gameData != undefined) {
							gameData.started = true;
							setGameData({ ...gameData });
						}
						break;
					case "turn":
						// todo: update game state after turn
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
	return {
		findMatch: findMatch.mutate,
		gameId,
		error: findMatch.error || websocketError,
		gameData: gameData,
		sendChatMessage: (message: string) => {
			sendJsonMessage({ type: "chatMessage", message });
		},
	};
}
