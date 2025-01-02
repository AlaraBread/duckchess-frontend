import { useTernaryDarkMode } from "./hooks/ternary_dark_mode";

export function ThemeSelector() {
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
