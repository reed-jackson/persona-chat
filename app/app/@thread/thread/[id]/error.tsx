"use client";

import { Heading, Text, Flex } from "@radix-ui/themes";

export default function ThreadError() {
	return (
		<Flex direction="column" className="h-full" justify="center" align="center">
			<Heading>Error</Heading>
			<Text>Failed to load thread</Text>
		</Flex>
	);
}
