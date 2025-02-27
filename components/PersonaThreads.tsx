import { Avatar, Box, Flex, IconButton, ScrollArea, Text } from "@radix-ui/themes";
import { IconMessagePlus } from "@tabler/icons-react";
import { type Thread, type Persona, createThread } from "@/lib/supabase";
import { useState } from "react";

type PersonaThreadsProps = {
	persona: Persona;
	threads: Thread[];
	onSelectThread: (thread: Thread) => void;
	onNewThread: (thread: Thread) => void;
	selectedThreadId?: string;
};

export default function PersonaThreads({
	persona,
	threads,
	onSelectThread,
	onNewThread,
	selectedThreadId,
}: PersonaThreadsProps) {
	const [error, setError] = useState<string>();

	const handleNewThread = async () => {
		try {
			const thread = await createThread(persona.id, `Chat with ${persona.name}`);
			onNewThread(thread);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to create thread");
		}
	};

	return (
		<Flex direction="column" height="100%">
			<Box p="4" style={{ borderBottom: "1px solid var(--gray-6)", height: "var(--space-9)" }}>
				<Flex justify="between" align="center">
					<Flex align="center" gap="2">
						<Avatar size="2" fallback={persona.name[0]} color="blue" className="cursor-pointer" radius="full" />
						<Text size="4" weight="bold">
							{persona.name}
						</Text>
					</Flex>
					<IconButton variant="soft" onClick={handleNewThread}>
						<IconMessagePlus size={16} />
					</IconButton>
				</Flex>
			</Box>

			{error && (
				<Box px="4" py="2">
					<Text color="red" size="2">
						{error}
					</Text>
				</Box>
			)}

			<ScrollArea type="hover" scrollbars="vertical" className="flex-1">
				<Box>
					<Flex direction="column" gap="1">
						{threads.length === 0 ? (
							<Box p="4">
								<Text color="gray">No chats yet. Start a new conversation!</Text>
							</Box>
						) : (
							threads.map((thread) => (
								<Flex
									key={thread.id}
									className={`cursor-pointer`}
									style={{
										borderBottom: "1px solid var(--gray-6)",
										color: selectedThreadId === thread.id ? "var(--accent-10)" : undefined,
									}}
									onClick={() => onSelectThread(thread)}
									p={"3"}
									direction="column"
								>
									<Text weight="medium">{thread.title}</Text>
									<Text size="2" color="gray">
										{new Date(thread.created_at).toLocaleDateString()}
									</Text>
								</Flex>
							))
						)}
					</Flex>
				</Box>
			</ScrollArea>
		</Flex>
	);
}
