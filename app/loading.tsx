import styles from "./loading.module.css";

export default function Loading() {
	return (
		<div className="centerContainer">
			<div className="grow" />
			<img
				alt="loading"
				src="/duck-icon.svg"
				className={styles.loading}
			/>
			<div className="grow" />
		</div>
	);
}
