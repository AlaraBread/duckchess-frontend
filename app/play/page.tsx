"use client";

import { useRouter } from "next/navigation";
import loadingStyles from "../loading.module.css";
import styles from "./play.module.css";
import { GameData, useMatch, Piece, Tile, Player } from "./match";
import { RefObject, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";

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
			turn={turn ?? "white"}
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
						className="button"
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
						className="button"
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
	const boardRef = useRef<HTMLTableElement>(null);
	const tileButtons = [...Array(8).keys()].map((_) =>
		// this is fine because the size of the board doesnt change
		// eslint-disable-next-line react-hooks/rules-of-hooks
		[...Array(8).keys()].map((_) => useRef<HTMLButtonElement>(null)),
	);
	if (!gameData.board) {
		return <></>;
	}
	return (
		<table ref={boardRef} className={styles.board} cellSpacing="0">
			<tbody>
				{gameData.board.board.map((row, y) => (
					<tr key={y}>
						{row.map((tile, x) => (
							<BoardTile
								key={x}
								tileButtons={tileButtons}
								turn={props.turn}
								coords={[x, y]}
								selected={selected}
								setSelected={setSelected}
								piece={tile.piece}
								moves={props.moves}
								tile={tile}
								sendTurn={props.sendTurn}
								player={props.player}
								boardRef={boardRef}
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
	boardRef: RefObject<HTMLTableElement | null>;
	tileButtons: RefObject<HTMLButtonElement | null>[][];
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
	const isSelectable =
		props.player == props.piece?.owner &&
		props.turn == props.player &&
		pieceIdx != -1;
	return (
		<td
			className={`${styles.tile} ${
				props.tile.floor == "dark" ? styles.dark : styles.light
			} ${canMoveHere ? styles.moveTarget : ""}`}
		>
			<TileContents
				{...props}
				isSelectable={isSelectable}
				isSelected={isSelected}
				canMoveHere={canMoveHere}
				selectedPieceIdx={selectedPieceIdx}
				moveIdx={moveIdx}
			/>
		</td>
	);
}

function TileContents(props: {
	piece: Piece | undefined;
	isSelectable: boolean;
	isSelected: boolean;
	canMoveHere: boolean;
	setSelected: (piece: [number, number] | undefined) => void;
	coords: [number, number];
	boardRef: RefObject<HTMLTableElement | null>;
	sendTurn: (pieceIdx: number, moveIdx: number) => void;
	selectedPieceIdx: number;
	moveIdx: number;
	tileButtons: RefObject<HTMLButtonElement | null>[][];
}) {
	const [isDragged, setDragged] = useState(false);
	const color = props.canMoveHere
		? "#dd217d"
		: props.isSelected && props.isSelectable
			? "#ff5f00"
			: props.isSelectable
				? "#ffb00d"
				: undefined;
	const hoverBgColor = color ? color + "ff" : "#00000000";
	const bgColor = color ? color + "88" : "#00000000";
	return (
		<motion.div
			className={styles.tileContentsContainer}
			initial={{ background: "#00000000" }}
			animate={{
				background: bgColor,
			}}
			transition={{ ease: "easeOut", duration: 0.1 }}
			whileHover={{
				background: hoverBgColor,
			}}
		>
			<motion.button
				ref={props.tileButtons[props.coords[1]][props.coords[0]]}
				className={`${styles.tileContents} ${isDragged ? styles.dragged : ""}`}
				drag
				dragElastic={0.05}
				dragConstraints={
					props.isSelectable
						? props.boardRef
						: { top: 0, bottom: 0, left: 0, right: 0 }
				}
				whileDrag={{ scale: 1.2 }}
				dragSnapToOrigin={true}
				onDragStart={() => {
					props.setSelected(props.coords);
					setDragged(true);
				}}
				onDragEnd={() => {
					setDragged(false);
				}}
				whileHover={props.isSelectable ? { translateY: -8 } : undefined}
				whileTap={
					props.isSelectable
						? { scale: 0.9, translateY: 8 }
						: undefined
				}
				onTap={() => {
					if (props.canMoveHere) {
						props.sendTurn(props.selectedPieceIdx, props.moveIdx);
					} else {
						props.setSelected(
							props.isSelected ? undefined : props.coords,
						);
					}
				}}
				aria-selected={props.isSelected}
				aria-disabled={!(props.canMoveHere || props.isSelectable)}
				onKeyDown={(event) => {
					if (event.key == "ArrowUp" && props.coords[1] > 0) {
						props.tileButtons[props.coords[1] - 1][
							props.coords[0]
						].current?.focus();
					} else if (
						event.key == "ArrowDown" &&
						props.coords[1] < 7
					) {
						props.tileButtons[props.coords[1] + 1][
							props.coords[0]
						].current?.focus();
					} else if (
						event.key == "ArrowLeft" &&
						props.coords[0] > 0
					) {
						props.tileButtons[props.coords[1]][
							props.coords[0] - 1
						].current?.focus();
					} else if (
						event.key == "ArrowRight" &&
						props.coords[0] < 7
					) {
						props.tileButtons[props.coords[1]][
							props.coords[0] + 1
						].current?.focus();
					}
				}}
			>
				{props.piece != undefined && (
					<>
						<img
							alt={`${props.piece.owner} ${props.piece.pieceType.type}`}
							src={`/pieces/${props.piece.owner}/${props.piece.pieceType.type}.svg`}
						/>
					</>
				)}
			</motion.button>
		</motion.div>
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
					<div
						className={styles.chatMessages}
						ref={chatMessages}
						aria-live="polite"
						role="log"
						aria-label="game log"
					>
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
				<button className="button" onClick={handleSendMessage}>
					send
				</button>
			</div>
		</div>
	);
}
