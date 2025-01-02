import "./globals.css";
import type { Metadata } from "next";
import { LayoutClient } from "./layout_client";

export const metadata: Metadata = {
	title: "duckchess",
	description: "chess but silly",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return <LayoutClient>{children}</LayoutClient>;
}
