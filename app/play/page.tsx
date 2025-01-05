"use client";

import { useRouter } from "next/navigation";
import loadingStyles from "../loading.module.css";
import styles from "./play.module.css";
import { GameData, useMatch } from "./match";
import { useEffect, useMemo, useRef, useState } from "react";

export default function Play() {
	const { gameId, error, findMatch, gameData, sendChatMessage } = useMatch();
	if (!gameData || !gameData.started) {
		return (
			<Matchmaking
				gameId={gameId}
				error={error}
				findMatch={findMatch}
				gameData={gameData}
			/>
		);
	}
	return <Game gameData={gameData} sendChatMessage={sendChatMessage} />;
}

function Matchmaking(props: {
	error: Error | Event | undefined;
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
}) {
	const { gameData } = props;
	return (
		<div className={styles.game}>
			<table className={styles.board} cellSpacing="0">
				<tbody>
					{gameData.board.map((row, i) => (
						<tr key={i}>
							{row.map((tile, i) => (
								<td
									key={i}
									className={`${styles.tile} ${
										tile.floor == "dark"
											? styles.dark
											: styles.light
									}`}
								></td>
							))}
						</tr>
					))}
				</tbody>
			</table>
			<div className="grow" />
			<Chat
				messages={gameData.chat}
				sendMessage={props.sendChatMessage}
			/>
		</div>
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
