import { Theme } from "@radix-ui/themes";

import "./globals.css";
import "@radix-ui/themes/styles.css";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";

const geist = Geist({ subsets: ["latin"] });
export const metadata: Metadata = {
	title: "PersonaChat",
	description: "Create and chat with AI personas to gather valuable product feedback",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body className={`${geist.className}`}>
				<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
					<Theme accentColor="blue" radius="medium">
						{children}
					</Theme>
				</ThemeProvider>
			</body>
		</html>
	);
}
