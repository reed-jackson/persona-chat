import { Box, Flex } from "@radix-ui/themes";

export default function ThreadLoading() {
	return (
		<Flex direction="column" className="h-full" style={{ borderLeft: "1px solid var(--gray-9)" }}>
			<Box px="4" py="3" className="flex-none" style={{ borderBottom: "1px solid var(--gray-9)" }}>
				<Box className="w-48 h-6 bg-gray-4 animate-pulse rounded mb-2" />
				<Box className="w-32 h-4 bg-gray-4 animate-pulse rounded" />
			</Box>
			<Box className="flex-1 min-h-0 overflow-y-auto">
				<Flex direction="column" className="p-4 gap-4">
					{[...Array(5)].map((_, i) => (
						<Flex key={i} align="start" gap="3" className={i % 2 === 0 ? "self-start" : "self-end"}>
							<Box className="w-64 h-12 bg-gray-4 animate-pulse rounded" />
						</Flex>
					))}
				</Flex>
			</Box>
		</Flex>
	);
}
