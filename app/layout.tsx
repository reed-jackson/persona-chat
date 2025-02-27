import { Theme } from "@radix-ui/themes";

import "./globals.css";
import "@radix-ui/themes/styles.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "PersonaChat",
	description: "Create and chat with AI personas to gather valuable product feedback",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body className={`${inter.className} `}>
				<Theme appearance="dark" accentColor="blue" radius="medium">
					{children}
				</Theme>
			</body>
		</html>
	);
}
