import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export type FloorType = "light" | "dark";

export type PieceType =
	| "queen"
	| { type: "king"; hasCastled: boolean }
	| "castle"
	| "bishop"
	| "knight"
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
	players: number[];
	board: Tile[][];
}

export function useFindMatch() {
	const findMatch = useMutation({
		mutationFn: () =>
			fetch("http://localhost:8000/game/find_match", {
				method: "POST",
				credentials: "include",
			}).then((response) => response.json() as Promise<number>),
	});
	const [hasFired, setHasFired] = useState(false);
	useEffect(() => {
		if (!hasFired) {
			findMatch.mutate();
			setHasFired(true);
		}
	}, [hasFired, findMatch]);
	const gameData = useQuery({
		queryFn: () =>
			fetch(`http://localhost:8000/game/${findMatch.data}`, {
				credentials: "include",
			}).then((response) => response.json() as Promise<GameData>),
		queryKey: ["gameData", findMatch.data],
		enabled: findMatch.data != undefined,
	});
	return {
		findMatch: findMatch.mutate,
		gameId: findMatch.data,
		error: findMatch.error || gameData.error,
		gameData: gameData.data,
	};
}
