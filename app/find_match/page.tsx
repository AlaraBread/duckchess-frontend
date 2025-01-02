"use client";

import { useRouter } from "next/navigation";
import styles from "../loading.module.css";
import { useFindMatch } from "./find_match";
import { useListenGame } from "../hooks/listen_game";
import { useCallback, useEffect } from "react";

export default function FindMatch() {
	const router = useRouter();
	const { gameId, error: findError, findMatch, gameData } = useFindMatch();
	const { error: listenError } = useListenGame(
		gameId,
		useCallback((event) => {
			console.log("listen event: ", event);
			if (event.type == "playerJoined") {
				//router.push("/");
			}
		}, []),
	);
	useEffect(() => {
		if (gameData && gameData.players.length > 1) {
			//router.push("/");
		}
	}, [gameData, router]);
	return (
		<div className="centerContainer">
			{findError || listenError ? (
				<>
					<h1>something went wrong</h1>
					<div className="grow" />
					<img
						alt="loading"
						src="/duck-open.svg"
						className={styles.loadingStopped}
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
						className={styles.loading}
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
