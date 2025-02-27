"use client";

import { Flex, Text } from "@radix-ui/themes";

export default function DefaultThreadPage() {
	return (
		<Flex align="center" justify="center" flexGrow="1" className="h-full">
			<Text color="gray" align="center">
				Select a thread to start chatting
			</Text>
		</Flex>
	);
}
