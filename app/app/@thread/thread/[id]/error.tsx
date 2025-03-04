"use client";

import { Heading, Text, Flex } from "@radix-ui/themes";

export default function ThreadError() {
	return (
		<Flex direction="column" width="100%" justify="center" align="center">
			<Heading>Error</Heading>
			<Text>Failed to load thread</Text>
		</Flex>
	);
}
