import { Board, Move, Moves, Piece, Player, Vec2 } from "./game_provider";

export function rotateBoard(player: Player, board: Board): Board {
	if (player == "white") return board;
	// horizontal flip
	for (let y = 0; y < 8; y++) {
		board.board[y].reverse();
	}
	// vertical flip
	for (let y = 0; y < 4; y++) {
		for (let x = 0; x < 8; x++) {
			const tmp = board.board[y][x];
			board.board[y][x] = board.board[7 - y][x];
			board.board[7 - y][x] = tmp;
		}
	}
	return board;
}

export function rotateMoves(player: Player, moves: Moves): Moves {
	if (player == "white") return moves;
	moves.moves = moves.moves.map((moves) =>
		moves.map(rotateMove.bind(undefined, player))
	);
	moves.pieces = moves.pieces.map((v) => rotateVec2(v));
	return moves;
}

export function rotateMove(player: Player, move: Move): Move {
	if (player == "white") return move;
	move.from = rotateVec2(move.from);
	move.to = rotateVec2(move.to);
	return move;
}

function rotateVec2(v: Vec2): Vec2 {
	v[0] = 7 - v[0];
	v[1] = 7 - v[1];
	return v;
}

export function pieceHumanName(name: string | undefined): string {
	if (name == undefined) {
		return "empty";
	}
	// convert camelCase to spaced case
	return name
		.replaceAll(/([A-Z])/g, " $1")
		.toLowerCase()
		.trim();
}

export function pieceImage(piece: Piece): string {
	return `/pieces/${piece.owner}/${piece.pieceType.type}.svg`;
}
