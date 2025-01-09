"use client";

import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { ThemeSelector } from "./theme_selector";

export default function Home() {
	const router = useRouter();
	return (
		<div className="centerContainer">
			<img
				alt="duck chess icon"
				src="/duck-icon.svg"
				className={styles.logo}
			/>
			<h1>duck chess</h1>
			<div className="grow" />
			<button
				className="button"
				onClick={() => {
					router.push("/play");
				}}
			>
				play
			</button>
			<div className="grow" />
			<ThemeSelector />
		</div>
	);
}
