import { PieceType } from "../game_provider";

export const maxValue = 4800;
function pieceValue(piece: PieceType | undefined): number {
	if (piece == undefined) return 0;
	switch (piece.type) {
		case "king":
			return 400;
		case "queen":
			return 900;
		case "castle":
			return 500;
		case "bishop":
			return 300;
		case "knight":
			return 300;
		case "pawn":
			return 100;
	}
}

export function setupTotalValue(setup: (PieceType | undefined)[][]) {
	return setup
		.flatMap((row) => row.map((piece) => pieceValue(piece)))
		.reduce((prev, next) => prev + next);
}

export function setupNumKings(setup: (PieceType | undefined)[][]) {
	return setup
		.flatMap((row) =>
			row.map((piece) =>
				piece?.type == "king" ? (1 as number) : (0 as number)
			)
		)
		.reduce((prev, next) => prev + next);
}

export function boardSetupIsValid(setup: (PieceType | undefined)[][]) {
	const totalValue = setup
		.flatMap((row) => row.map((piece) => pieceValue(piece)))
		.reduce((prev, next) => prev + next);
	const numKings = setup
		.flatMap((row) =>
			row.map((piece) =>
				piece?.type == "king" ? (1 as number) : (0 as number)
			)
		)
		.reduce((prev, next) => prev + next);
	return numKings == 1 && totalValue <= maxValue;
}
