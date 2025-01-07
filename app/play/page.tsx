"use client";

import { useRouter } from "next/navigation";
import loadingStyles from "../loading.module.css";
import styles from "./play.module.css";
import { GameData, useMatch, Piece, Tile, Player } from "./match";
import { useEffect, useMemo, useRef, useState } from "react";
export default function Play() {
	const {
		gameId,
		error,
		findMatch,
		gameData,
		sendChatMessage,
		moves,
		sendTurn,
		player,
		turn,
	} = useMatch();
	if (!gameData || !gameData.board) {
		return (
			<Matchmaking
				gameId={gameId}
				error={error}
				findMatch={findMatch}
				gameData={gameData}
			/>
		);
	}
	return (
		<Game
			gameData={gameData}
			moves={moves}
			sendTurn={sendTurn}
			sendChatMessage={sendChatMessage}
			player={player}
			turn={turn}
		/>
	);
}

function Matchmaking(props: {
	error: string | undefined;
	findMatch: () => void;
	gameId: number | undefined;
	gameData: GameData | undefined;
}) {
	const router = useRouter();
	const { error, findMatch, gameId } = props;
	return (
		<div className="centerContainer">
			{error ? (
				<>
					<h1>something went wrong</h1>
					<div className="grow" />
					<img
						alt="loading"
						src="/duck-open.svg"
						className={loadingStyles.loadingStopped}
					/>
					<div className="grow" />
					<button
						onClick={() => {
							findMatch();
						}}
					>
						try again
					</button>
				</>
			) : (
				<>
					<h1>
						{gameId == undefined
							? "looking for a match..."
							: `in game #${gameId}, waiting for opponent...`}
					</h1>
					<div className="grow" />
					<img
						alt="loading"
						src="/duck-icon.svg"
						className={loadingStyles.loading}
					/>
					<div className="grow" />
					<button
						onClick={() => {
							router.push("/");
						}}
					>
						cancel
					</button>
				</>
			)}
		</div>
	);
}

function Game(props: {
	gameData: GameData;
	sendChatMessage: (m: string) => void;
	moves:
		| {
				pieces: [number, number][];
				moves: [number, number][][];
		  }
		| undefined;
	sendTurn: (pieceIdx: number, moveIdx: number) => void;
	player: Player;
	turn: Player;
}) {
	return (
		<div className={styles.game}>
			<Board
				turn={props.turn}
				gameData={props.gameData}
				moves={props.moves}
				sendTurn={props.sendTurn}
				player={props.player}
			/>
			<div className="grow" />
			<Chat
				messages={props.gameData.chat}
				sendMessage={props.sendChatMessage}
			/>
		</div>
	);
}

function Board(props: {
	gameData: GameData;
	turn: Player;
	moves:
		| {
				pieces: [number, number][];
				moves: [number, number][][];
		  }
		| undefined;
	sendTurn: (pieceIdx: number, moveIdx: number) => void;
	player: Player;
}) {
	const { gameData } = props;
	const [selected, setSelected] = useState<[number, number] | undefined>(
		undefined,
	);
	if (!gameData.board) {
		return <></>;
	}
	return (
		<table className={styles.board} cellSpacing="0">
			<tbody>
				{gameData.board.board.map((row, y) => (
					<tr key={y}>
						{row.map((tile, x) => (
							<BoardTile
								key={x}
								turn={props.turn}
								coords={[x, y]}
								selected={selected}
								setSelected={setSelected}
								piece={tile.piece}
								moves={props.moves}
								tile={tile}
								sendTurn={props.sendTurn}
								player={props.player}
							/>
						))}
					</tr>
				))}
			</tbody>
		</table>
	);
}

function BoardTile(props: {
	piece: Piece | undefined;
	moves:
		| {
				pieces: [number, number][];
				moves: [number, number][][];
		  }
		| undefined;
	coords: [number, number];
	selected: [number, number] | undefined;
	setSelected: (piece: [number, number] | undefined) => void;
	tile: Tile;
	turn: Player;
	sendTurn: (pieceIdx: number, moveIdx: number) => void;
	player: Player;
}) {
	const { selected } = props;
	const pieceIdx =
		props.moves?.pieces.findIndex(
			(piece) =>
				piece[0] == props.coords[0] && piece[1] == props.coords[1],
		) ?? -1;
	const selectedPieceIdx =
		(selected
			? props.moves?.pieces.findIndex(
					(piece) =>
						piece[0] == selected[0] && piece[1] == selected[1],
				)
			: -1) ?? -1;
	const moves =
		selectedPieceIdx != -1
			? props.moves?.moves[selectedPieceIdx]
			: undefined;
	const moveIdx =
		moves?.findIndex(
			([x, y]) => x == props.coords[0] && y == props.coords[1],
		) ?? -1;
	const canMoveHere = moveIdx != -1;
	const isSelected =
		(props.selected &&
			props.selected[0] == props.coords[0] &&
			props.selected[1] == props.coords[1]) ??
		false;
	return (
		<td
			className={`${styles.tile} ${
				props.tile.floor == "dark" ? styles.dark : styles.light
			} ${canMoveHere ? styles.moveTarget : ""}`}
		>
			{props.piece ? (
				<>
					<img
						alt={`${props.piece.owner} ${props.piece.pieceType.type}`}
						src={`/pieces/${props.piece.owner}/${props.piece.pieceType.type}.svg`}
					/>
					{props.player == props.piece.owner &&
						props.turn == props.player &&
						pieceIdx != -1 && (
							<input
								type="checkbox"
								checked={isSelected}
								onChange={(event) => {
									props.setSelected(
										event.target.checked
											? props.coords
											: undefined,
									);
								}}
							></input>
						)}
					{canMoveHere && (
						<button
							onClick={() => {
								props.sendTurn(selectedPieceIdx, moveIdx);
							}}
						>
							move here
						</button>
					)}
				</>
			) : (
				canMoveHere && (
					<button
						onClick={() => {
							props.sendTurn(selectedPieceIdx, moveIdx);
						}}
					>
						move here
					</button>
				)
			)}
		</td>
	);
}

function Chat(props: { messages: string[]; sendMessage: (m: string) => void }) {
	const { sendMessage, messages } = props;
	const [inputText, setInputText] = useState("");
	function handleSendMessage() {
		if (inputText == "") {
			return;
		}
		sendMessage(inputText);
		setInputText("");
	}
	const chatMessages = useRef<HTMLDivElement | null>(null);
	useEffect(() => {
		chatMessages.current?.scrollTo({
			behavior: "smooth",
			top: chatMessages.current.getBoundingClientRect().bottom,
		});
	}, [messages]);
	return (
		<div className={styles.chat}>
			{useMemo(
				() => (
					<div className={styles.chatMessages} ref={chatMessages}>
						{messages.map((message, i) => (
							<section role="region" key={i}>
								{message}
							</section>
						))}
					</div>
				),
				[messages],
			)}
			<div className={styles.chatInput}>
				<input
					enterKeyHint="send"
					placeholder="say something to your opponent"
					value={inputText}
					onChange={(event) => {
						setInputText(event.target.value);
					}}
					onKeyDown={(event) => {
						if (event.key == "Enter" && !event.shiftKey) {
							handleSendMessage();
						}
					}}
				/>
				<button onClick={handleSendMessage}>send</button>
			</div>
		</div>
	);
}
