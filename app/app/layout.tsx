"use client";

import "@radix-ui/themes/styles.css";
import { Box, Flex } from "@radix-ui/themes";
import MobileMenu from "@/components/MobileMenu";
import { Toaster } from "sonner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
	return (
		<Flex width="100%" className="overflow-hidden" position="fixed" top="0" left="0" right="0" bottom="0">
			<Toaster position="top-right" closeButton richColors />
			<Box position="absolute" top="3" left="3" display={{ initial: "block", md: "none" }}>
				<MobileMenu personas={[]} threads={[]} onSelectPersona={() => {}} onNewPersona={() => {}} onNewThread={() => {}} />
			</Box>
			{children}
		</Flex>
	);
}
