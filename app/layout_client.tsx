"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTernaryDarkMode } from "./hooks/ternary_dark_mode";

const queryClient = new QueryClient();

export function LayoutClient({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const { ternaryDarkMode } = useTernaryDarkMode();
	return (
		<html
			lang="en"
			data-theme={
				ternaryDarkMode == "system" ? undefined : ternaryDarkMode
			}
		>
			<body>
				<QueryClientProvider client={queryClient}>
					{children}
				</QueryClientProvider>
			</body>
		</html>
	);
}
