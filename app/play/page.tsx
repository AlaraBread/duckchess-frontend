"use client";

import { useRouter } from "next/navigation";
import loadingStyles from "../loading.module.css";
import styles from "./play.module.css";
import { GameData, useMatch, Piece, Tile, Player, Move, Moves } from "./match";
import {
	RefObject,
	useCallback,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from "react";
import { motion, PanInfo } from "motion/react";
import { flip, shift, useFloating } from "@floating-ui/react-dom";

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
		boardAnimations,
		setBoardAnimations,
		applyMove,
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
			boardAnimations={boardAnimations}
			setBoardAnimations={setBoardAnimations}
			applyMove={applyMove}
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
	moves: Moves | undefined;
	sendTurn: (pieceIdx: number, moveIdx: number) => void;
	player: Player;
	turn: Player;
	boardAnimations: Move[] | undefined;
	setBoardAnimations: (animations: Move[] | undefined) => void;
	applyMove: (move: Move) => void;
}) {
	return (
		<div className={styles.game}>
			<Board {...props} />
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
	moves: Moves | undefined;
	sendTurn: (pieceIdx: number, moveIdx: number) => void;
	player: Player;
	boardAnimations: Move[] | undefined;
	setBoardAnimations: (animations: Move[] | undefined) => void;
	applyMove: (move: Move) => void;
}) {
	const { gameData } = props;
	const [selected, setSelected] = useState<[number, number] | undefined>(
		undefined,
	);
	const [open, setOpen] = useState<[number, number] | undefined>(undefined);
	useEffect(() => {
		if (!selected) {
			setOpen(undefined);
		}
	}, [selected]);
	const selectedPiece =
		gameData.board && selected != undefined
			? gameData.board.board[selected[1]][selected[0]].piece
			: undefined;
	const boardRef = useRef<HTMLTableElement>(null);
	const tileButtons = [...Array(8).keys()].map((_) =>
		// this is fine because the size of the board doesnt change
		// eslint-disable-next-line react-hooks/rules-of-hooks
		[...Array(8).keys()].map((_) => useRef<HTMLButtonElement>(null)),
	);
	useEffect(() => {
		if (props.turn != props.player || !props.moves) {
			setSelected(undefined);
		}
	}, [props.moves, props.player, props.turn, setSelected]);
	const { boardAnimations, setBoardAnimations, applyMove } = props;
	const [currentAnimation, setCurrentAnimation] = useState<
		Move | undefined
	>();
	const finishAnimation = useCallback(() => {
		if (currentAnimation) {
			applyMove(currentAnimation);
		}
		if (boardAnimations && boardAnimations.length > 0) {
			const move = boardAnimations.shift();
			setCurrentAnimation(move);
			setBoardAnimations([...boardAnimations]);
		} else {
			setCurrentAnimation(undefined);
		}
	}, [
		boardAnimations,
		setBoardAnimations,
		currentAnimation,
		setCurrentAnimation,
		applyMove,
	]);
	useEffect(() => {
		if (currentAnimation == undefined) {
			finishAnimation();
		}
	}, [currentAnimation, finishAnimation]);
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
								selectedPiece={selectedPiece}
								open={open}
								setOpen={setOpen}
								piece={tile.piece}
								moves={props.moves}
								tile={tile}
								sendTurn={(piece, move) => {
									setSelected(undefined);
									props.sendTurn(piece, move);
								}}
								player={props.player}
								boardRef={boardRef}
								finishAnimation={finishAnimation}
								currentAnimation={currentAnimation}
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
	moves: Moves | undefined;
	coords: [number, number];
	selected: [number, number] | undefined;
	setSelected: (piece: [number, number] | undefined) => void;
	selectedPiece: Piece | undefined;
	tile: Tile;
	turn: Player;
	sendTurn: (pieceIdx: number, moveIdx: number) => void;
	player: Player;
	boardRef: RefObject<HTMLTableElement | null>;
	tileButtons: RefObject<HTMLButtonElement | null>[][];
	finishAnimation: () => void;
	currentAnimation: Move | undefined;
	open: [number, number] | undefined;
	setOpen: (o: [number, number] | undefined) => void;
}) {
	const { selected } = props;
	const pieceIdx =
		props.moves?.pieces.findIndex(
			(piece) =>
				piece[0] == props.coords[0] && piece[1] == props.coords[1],
		) ?? -1;
	const selectedPieceIdx =
		(selected && !props.currentAnimation
			? props.moves?.pieces.findIndex(
					(piece) =>
						piece[0] == selected[0] && piece[1] == selected[1],
				)
			: -1) ?? -1;
	const moves =
		selectedPieceIdx != -1
			? props.moves?.moves[selectedPieceIdx]
			: undefined;
	const movesThatEndHere =
		moves
			?.map((move, idx) => [move, idx] as const)
			.filter(
				([move]) =>
					move.to[0] == props.coords[0] &&
					move.to[1] == props.coords[1],
			) ?? [];
	const canMoveHere = movesThatEndHere.length > 0;
	const isSelected =
		(props.selected &&
			!props.currentAnimation &&
			props.selected[0] == props.coords[0] &&
			props.selected[1] == props.coords[1]) ??
		false;
	const isSelectable =
		!props.currentAnimation &&
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
				movesThatEndHere={movesThatEndHere}
				moves={moves}
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
	movesThatEndHere: (readonly [Move, number])[];
	moves: Move[] | undefined;
	tileButtons: RefObject<HTMLButtonElement | null>[][];
	finishAnimation: () => void;
	currentAnimation: Move | undefined;
	selectedPiece: Piece | undefined;
	open: [number, number] | undefined;
	setOpen: (o: [number, number] | undefined) => void;
}) {
	const { refs, floatingStyles } = useFloating({
		placement: "top",
		middleware: [flip(), shift()],
	});
	const [isDragged, setDragged] = useState(false);
	useEffect(() => {
		if (!props.isSelectable) {
			setDragged(false);
		}
	}, [props.isSelectable]);
	const isOpen =
		!!props.open &&
		props.open[0] == props.coords[0] &&
		props.open[1] == props.coords[1];
	function setOpen(o: boolean) {
		if (o) {
			const firstButton: HTMLButtonElement | null | undefined = refs
				.floating.current?.firstElementChild as HTMLButtonElement;
			console.log("setting to open", firstButton);
			props.setOpen(props.coords);
			firstButton?.focus();
		} else {
			console.log(
				"setting to closed",
				props.tileButtons[props.coords[1]][props.coords[0]].current,
			);
			props.tileButtons[props.coords[1]][
				props.coords[0]
			].current?.focus();
			if (isOpen) props.setOpen(undefined);
		}
	}
	const menuId = useId();
	const color = props.canMoveHere
		? "#dd217d"
		: props.isSelected && props.isSelectable
			? "#ff5f00"
			: props.isSelectable
				? "#ffb00d"
				: undefined;
	const hoverBgColor = color ? color + "ff" : "#00000000";
	const bgColor = color ? color + (isOpen ? "ff" : "88") : "#00000000";
	const tileWidth =
		props.tileButtons[0][0].current?.getBoundingClientRect().width ?? 0;
	const animateX: (number | undefined)[] = [0];
	const animateY: (number | undefined)[] = [0];
	const animateScale: (number | undefined)[] = [1];
	if (props.currentAnimation) {
		if (
			props.currentAnimation.from[0] == props.coords[0] &&
			props.currentAnimation.from[1] == props.coords[1]
		) {
			// this tile is moving somewhere else
			const offsetX =
				props.currentAnimation.to[0] - props.currentAnimation.from[0];
			const offsetY =
				props.currentAnimation.to[1] - props.currentAnimation.from[1];
			animateX.push(offsetX * tileWidth);
			animateY.push(offsetY * tileWidth);
		} else if (
			props.currentAnimation.to[0] == props.coords[0] &&
			props.currentAnimation.to[1] == props.coords[1]
		) {
			// this tile is getting captured
			animateScale.push(0);
		}
	}
	function moveToDragEnd(info: PanInfo) {
		if (!tileWidth) {
			return;
		}
		const xOffset = Math.round(info.offset.x / tileWidth);
		const yOffset = Math.round(info.offset.y / tileWidth);
		const targetX = props.coords[0] + xOffset;
		const targetY = props.coords[1] + yOffset;
		if (!(targetX >= 0 && targetX < 8 && targetY >= 0 && targetY < 8)) {
			return;
		}
		const moves =
			props.moves
				?.map((move, idx) => [move, idx] as const)
				.filter(
					([move]) => move.to[0] == targetX && move.to[1] == targetY,
				) ?? [];
		if (moves.length == 1) {
			props.sendTurn(props.selectedPieceIdx, moves[0][1]);
		} else if (moves.length > 1) {
			// open dialog to pick move
			console.log("opening from drag");
			props.setOpen([targetX, targetY]);
		}
	}
	return (
		<>
			<motion.button
				ref={props.tileButtons[props.coords[1]][props.coords[0]]}
				className={styles.tileContentsContainer}
				initial={{ background: "#00000000" }}
				animate={{
					background: bgColor,
				}}
				transition={{ ease: "easeOut", duration: 0.1 }}
				whileHover={{
					background: hoverBgColor,
				}}
				onTap={() => {
					if (props.canMoveHere) {
						if (props.movesThatEndHere.length == 1) {
							console.log("moving from tap");
							props.sendTurn(
								props.selectedPieceIdx,
								props.movesThatEndHere[0][1],
							);
						} else if (props.movesThatEndHere.length > 1) {
							console.log("opening from tap");
							setOpen(!isOpen);
						}
					} else if (props.isSelectable) {
						console.log("selecting from tap");
						props.setSelected(
							props.isSelected && !isDragged
								? undefined
								: props.coords,
						);
					} else {
						console.log("tapped outside");
						props.setSelected(undefined);
					}
				}}
				aria-pressed={props.isSelected}
				aria-disabled={!(props.canMoveHere || props.isSelectable)}
				aria-haspopup={props.movesThatEndHere.length > 1}
				aria-expanded={props.movesThatEndHere.length > 1 && isOpen}
				aria-controls={menuId}
				role="button"
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
				<motion.div
					className={`${styles.tileContents} ${isDragged || animateX.length > 0 ? styles.dragged : ""}`}
					drag
					dragElastic={0.05}
					dragConstraints={
						props.isSelectable && animateX.length == 1
							? props.boardRef
							: { top: 0, bottom: 0, left: 0, right: 0 }
					}
					whileDrag={{ scale: 1.2 }}
					dragSnapToOrigin={true}
					onDragStart={() => {
						props.setSelected(props.coords);
						setDragged(true);
					}}
					onDragEnd={(_e, info) => {
						setDragged(false);
						moveToDragEnd(info);
					}}
					whileHover={
						props.isSelectable || props.canMoveHere
							? { translateY: -8 }
							: undefined
					}
					whileTap={
						props.isSelectable || props.canMoveHere
							? { scale: 0.9, translateY: 8 }
							: undefined
					}
					dragTransition={{
						bounceDamping: 1000000000,
						bounceStiffness: 1000000000,
					}}
					transition={{
						duration: 0.1,
						ease: "backOut",
					}}
				>
					{props.piece != undefined && (
						<motion.img
							animate={{
								translateX: animateX,
								translateY: animateY,
								scale: animateScale,
							}}
							transition={{ duration: 0.2, ease: "backOut" }}
							onAnimationComplete={() => {
								// only one piece can call finishAnimation
								// this works for now
								if (
									animateScale.length == 1 &&
									animateX.length == 2
								)
									props.finishAnimation();
							}}
							alt={`${props.piece.owner} ${pieceHumanName(props.piece.pieceType.type)}`}
							src={pieceImage(props.piece)}
						/>
					)}
				</motion.div>
			</motion.button>
			<div className={styles.promotionMenuContainer}>
				{props.movesThatEndHere.length > 1 ? (
					<motion.div
						// https://www.w3.org/WAI/ARIA/apg/patterns/menubar/
						role="menu"
						aria-hidden={!isOpen}
						aria-label="promotion options"
						aria-orientation="horizontal"
						id={menuId}
						className={styles.promotionMenu}
						onKeyDown={(event) => {
							if (event.key == "Escape") {
								setOpen(false);
							} else if (event.key == "Home") {
								const firstButton:
									| HTMLButtonElement
									| null
									| undefined = refs.floating.current
									?.firstElementChild as HTMLButtonElement;
								firstButton?.focus();
							} else if (event.key == "End") {
								const lastButton:
									| HTMLButtonElement
									| null
									| undefined = refs.floating.current
									?.firstElementChild as HTMLButtonElement;
								lastButton?.focus();
							} else if (
								event.key == "Left Arrow" ||
								event.key == "Down Arrow"
							) {
								const prev:
									| HTMLButtonElement
									| null
									| undefined = document.activeElement
									?.previousElementSibling as HTMLButtonElement;
								prev?.focus();
							} else if (
								event.key == "Right Arrow" ||
								event.key == "Up Arrow"
							) {
								const next:
									| HTMLButtonElement
									| null
									| undefined = document.activeElement
									?.nextElementSibling as HTMLButtonElement;
								next?.focus();
							}
						}}
						style={floatingStyles}
						ref={refs.setFloating}
					>
						{props.movesThatEndHere.map(([move, idx]) => {
							if (
								move.moveType.type != "promotion" ||
								!props.selectedPiece
							)
								return <></>;
							return (
								<motion.button
									key={idx}
									tabIndex={-1}
									role="menuitem"
									onTap={() => {
										setOpen(false);
										props.sendTurn(
											props.selectedPieceIdx,
											idx,
										);
									}}
								>
									<img
										src={pieceImage({
											pieceType: move.moveType.into,
											owner: props.selectedPiece.owner,
										})}
										alt={`promote to ${pieceHumanName(move.moveType.into.type)}`}
									/>
								</motion.button>
							);
						})}
					</motion.div>
				) : undefined}
			</div>
		</>
	);
}

function pieceHumanName(name: string): string {
	// convert camelCase to spaced case
	return name
		.replaceAll(/([A-Z])/g, " $1")
		.toLowerCase()
		.trim();
}

function pieceImage(piece: Piece): string {
	return `/pieces/${piece.owner}/${piece.pieceType.type}.svg`;
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
