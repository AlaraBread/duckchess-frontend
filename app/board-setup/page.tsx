"use client";

import { useState } from "react";
import { PieceType, pieceTypes, Vec2 } from "../game_provider";
import playStyles from "../play/play.module.css";
import styles from "./board_setup.module.css";
import { AnimatePresence, motion } from "motion/react";
import { pieceHumanName, pieceImage } from "../play/page";
import { useLocalStorage } from "../hooks/local_storage";
import { useRouter } from "next/navigation";

const transition = {
	type: "tween",
	ease: "backOut",
	duration: 0.1,
};

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

const maxValue = 4800;
function setupTotalValue(setup: (PieceType | undefined)[][]) {
	return setup
		.flatMap((row) => row.map((piece) => pieceValue(piece)))
		.reduce((prev, next) => prev + next);
}

function setupNumKings(setup: (PieceType | undefined)[][]) {
	return setup
		.flatMap((row) =>
			row.map((piece) =>
				piece?.type == "king" ? (1 as number) : (0 as number),
			),
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
				piece?.type == "king" ? (1 as number) : (0 as number),
			),
		)
		.reduce((prev, next) => prev + next);
	return numKings == 1 && totalValue <= maxValue;
}

export default function BoardSetup() {
	const [selectedPiece, setSelectedPiece] = useState<PieceType | undefined>();
	const [setup, setSetup] = useLocalStorage<(PieceType | undefined)[][]>(
		"boardSetup",
		[
			[
				...Array(8)
					.keys()
					.map(() => undefined),
			],
			[
				...Array(8)
					.keys()
					.map(() => undefined),
			],
		],
	);
	const totalValue = setupTotalValue(setup);
	const numKings = setupNumKings(setup);
	const isValid = boardSetupIsValid(setup);
	const router = useRouter();
	return (
		<>
			<PieceSelector
				selectedPiece={selectedPiece}
				setSelectedPiece={setSelectedPiece}
			/>
			<Board
				selectedPiece={selectedPiece}
				setup={setup}
				setSetup={setSetup}
			/>
			<div className={styles.feedback}>
				<p>
					material value: {totalValue}/{maxValue}
				</p>
				{!isValid && <p>invalid setup</p>}
				{numKings != 1 && <p>must have exactly one king</p>}
				{totalValue > maxValue && (
					<p>
						material value exceeds maximum by{" "}
						{totalValue - maxValue}
					</p>
				)}
				{isValid && (
					<button
						className="button"
						onClick={() => {
							router.push("/play");
						}}
					>
						play
					</button>
				)}
			</div>
		</>
	);
}

function PieceSelector(props: {
	selectedPiece: PieceType | undefined;
	setSelectedPiece: (type: PieceType | undefined) => void;
}) {
	const { selectedPiece, setSelectedPiece } = props;
	const buttonTypes: (PieceType | undefined)[] = [...pieceTypes];
	buttonTypes.push(undefined);
	return (
		<div className={styles.pieceSelector}>
			{buttonTypes.map((pieceType) => {
				const humanName = pieceHumanName(pieceType?.type);
				const isSelected = selectedPiece == pieceType;
				return (
					<label
						key={humanName}
						className={isSelected ? styles.selected : undefined}
					>
						<input
							type="radio"
							name="pieces"
							onChange={() => {
								setSelectedPiece(pieceType);
							}}
							defaultChecked={pieceType == undefined}
						></input>
						<motion.img
							animate={{
								width: isSelected ? 80 : 70,
							}}
							whileHover={{ width: 75 }}
							whileTap={{ width: 65 }}
							transition={transition}
							src={
								pieceType
									? pieceImage({ owner: "white", pieceType })
									: "/empty.svg"
							}
							alt=""
						/>
						{humanName}
					</label>
				);
			})}
		</div>
	);
}

function Board(props: {
	selectedPiece: PieceType | undefined;
	setup: (PieceType | undefined)[][];
	setSetup: (s: (PieceType | undefined)[][]) => void;
}) {
	return (
		<table aria-label="board setup" className={playStyles.board}>
			<tbody>
				{[...Array(2).keys()].map((y) => (
					<tr key={y}>
						{[...Array(8).keys()].map((x) => (
							<Tile
								pos={[x, y]}
								key={x}
								selectedPiece={props.selectedPiece}
								setPiece={(piece) => {
									props.setup[y][x] = piece;
									props.setSetup([...props.setup]);
								}}
								piece={props.setup[y][x]}
							/>
						))}
					</tr>
				))}
			</tbody>
		</table>
	);
}

function Tile(props: {
	pos: Vec2;
	selectedPiece: PieceType | undefined;
	piece: PieceType | undefined;
	setPiece: (piece: PieceType | undefined) => void;
}) {
	return (
		<td
			className={`${playStyles.tile} ${
				(props.pos[0] + props.pos[1]) % 2 == 0
					? playStyles.light
					: playStyles.dark
			} ${styles.setupTile}`}
		>
			<motion.button
				onTap={() => {
					props.setPiece(props.selectedPiece);
				}}
			>
				<AnimatePresence>
					{props.piece != undefined && (
						<motion.img
							key={"" + props.piece?.type}
							src={pieceImage({
								owner: "white",
								pieceType: props.piece,
							})}
							alt=""
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							exit={{ scale: 0 }}
							transition={transition}
						/>
					)}
				</AnimatePresence>
				{props.piece && pieceHumanName(props.piece.type)}
			</motion.button>
		</td>
	);
}
