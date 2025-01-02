import { useEffect, useState } from "react";

type ListenEvent = { type: "playerJoined"; id: number } | { type: "turn" };

export function useListenGame(
	gameId: number | undefined,
	onEvent: (data: ListenEvent) => void,
) {
	const [error, setError] = useState(false);
	useEffect(() => {
		if (gameId == undefined) {
			return;
		}
		const source = new EventSource(
			`http://localhost:8000/game/${gameId}/listen`,
			{
				withCredentials: true,
			},
		);
		setError(false);
		source.onerror = () => {
			setError(true);
		};
		source.onmessage = (event) => {
			onEvent(JSON.parse(event.data));
		};
		return () => {
			source.close();
		};
	}, [onEvent, gameId]);
	return { error };
}
