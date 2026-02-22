import styles from "./loading.module.css";

export default function Loading() {
	return (
		<div className="centerContainer">
			<div className="grow" />
			<img
				alt="loading"
				src="/pieces/white/duck.svg"
				className={styles.loading}
			/>
			<div className="grow" />
		</div>
	);
}
