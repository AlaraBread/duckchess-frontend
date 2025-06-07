import { useLocalStorage } from "./hooks/local_storage";
import { useTernaryDarkMode } from "./hooks/ternary_dark_mode";
import styles from "./page.module.css";

export function Settings() {
	return (
		<div className={styles.settings}>
			<ThemeSelector />
			<ChatToggle />
		</div>
	);
}

function ThemeSelector() {
	const { setTernaryDarkMode, isDarkMode } = useTernaryDarkMode();
	return (
		<label>
			<input
				type="checkbox"
				checked={!isDarkMode}
				onChange={(event) => {
					setTernaryDarkMode(event.target.checked ? "light" : "dark");
				}}
			></input>
			{isDarkMode ? "lights off" : "lights on"}
		</label>
	);
}

function ChatToggle() {
	const [chatEnabled, setChatEnabled] = useLocalStorage("chatEnabled", true);
	return (
		<label>
			<input
				type="checkbox"
				checked={chatEnabled}
				onChange={(event) => {
					setChatEnabled(event.target.checked);
				}}
			></input>
			{chatEnabled ? "chat enabled" : "chat disabled"}
		</label>
	);
}
