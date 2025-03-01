import { Avatar, Box, Flex, IconButton, ScrollArea, Text, Dialog, TextField, Button } from "@radix-ui/themes";
import { IconMessagePlus, IconEdit } from "@tabler/icons-react";
import { type Thread, type Persona, createThread, updateThread } from "@/lib/supabase";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

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
	const [editingThread, setEditingThread] = useState<Thread | null>(null);
	const [newTitle, setNewTitle] = useState("");

	const handleNewThread = async () => {
		try {
			const thread = await createThread(persona.id, `Chat with ${persona.name}`);
			onNewThread(thread);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to create thread");
		}
	};

	const handleRenameThread = async (thread: Thread) => {
		try {
			const updatedThread = await updateThread(thread.id, { title: newTitle });
			setEditingThread(null);
			// Trigger a refresh of the threads list
			onSelectThread(updatedThread);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to rename thread");
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
									p={"3"}
									direction="column"
									gap="2"
								>
									<Flex justify="between" align="center">
										<Flex direction="column" onClick={() => onSelectThread(thread)}>
											<Text weight="medium">{thread.title}</Text>
											<Text size="2" color="gray">
												{formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
											</Text>
										</Flex>
										<Dialog.Root
											open={editingThread?.id === thread.id}
											onOpenChange={(open) => {
												if (!open) setEditingThread(null);
												if (open) {
													setEditingThread(thread);
													setNewTitle(thread.title);
												}
											}}
										>
											<Dialog.Trigger>
												<IconButton variant="ghost" size="1">
													<IconEdit size={16} />
												</IconButton>
											</Dialog.Trigger>
											<Dialog.Content>
												<Dialog.Title>Rename Thread</Dialog.Title>
												<Box my="4">
													<TextField.Root
														value={newTitle}
														onChange={(e) => setNewTitle(e.target.value)}
														placeholder="Enter new title"
													/>
												</Box>
												<Flex gap="3" justify="end">
													<Dialog.Close>
														<Button variant="soft" color="gray">
															Cancel
														</Button>
													</Dialog.Close>
													<Button
														variant="solid"
														onClick={() => handleRenameThread(thread)}
														disabled={!newTitle.trim() || newTitle === thread.title}
													>
														Save
													</Button>
												</Flex>
											</Dialog.Content>
										</Dialog.Root>
									</Flex>
								</Flex>
							))
						)}
					</Flex>
				</Box>
			</ScrollArea>
		</Flex>
	);
}
