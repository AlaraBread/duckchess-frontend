"use client";

import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { Settings } from "./settings";

export default function Home() {
	const router = useRouter();
	return (
		<div className="centerContainer">
			<img
				alt="duck chess icon"
				src="/pieces/white/duck.svg"
				className={styles.logo}
			/>
			<h1>duck chess</h1>
			<div className="grow" />
			<button
				className="button"
				onClick={() => {
					router.push("/board-setup");
				}}
			>
				play
			</button>
			<div className="grow" />
			<Settings />
		</div>
	);
}
