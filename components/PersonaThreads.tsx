import { Avatar, Box, Flex, IconButton, ScrollArea, Text, Dialog, TextField, Button } from "@radix-ui/themes";
import { IconMessagePlus, IconEdit } from "@tabler/icons-react";
import { type Thread, type Persona, createThread, updateThread } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { subscribeToThreadUpdates } from "@/utils/supabase/realtime";

type PersonaThreadsProps = {
	persona: Persona;
	threads: Thread[];
	onSelectThread: (thread: Thread) => void;
	onNewThread: (thread: Thread) => void;
	onThreadUpdate?: (thread: Thread) => void;
	selectedThreadId?: string;
};

export default function PersonaThreads({
	persona,
	threads,
	onSelectThread,
	onNewThread,
	onThreadUpdate,
	selectedThreadId,
}: PersonaThreadsProps) {
	const [error, setError] = useState<string>();
	const [editingThread, setEditingThread] = useState<Thread | null>(null);
	const [newTitle, setNewTitle] = useState("");

	// Subscribe to thread updates
	useEffect(() => {
		const unsubscribers = threads.map((thread) =>
			subscribeToThreadUpdates(thread.id, (updatedThread) => {
				// Notify parent of thread update
				onThreadUpdate?.(updatedThread);
			})
		);

		return () => {
			unsubscribers.forEach((unsubscribe) => unsubscribe());
		};
	}, [threads, onThreadUpdate]);

	const handleNewThread = async () => {
		try {
			const thread = await createThread(persona.id, `New Chat`);
			onNewThread(thread);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to create thread");
		}
	};

	const handleRenameThread = async (thread: Thread) => {
		try {
			const updatedThread = await updateThread(thread.id, { title: newTitle });
			setEditingThread(null);
			// Notify parent of thread update
			onThreadUpdate?.(updatedThread);
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
							<AnimatePresence>
								{threads.map((thread) => (
									<motion.div
										key={thread.id}
										layout
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -20 }}
										transition={{ duration: 0.2 }}
									>
										<Flex
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
													<motion.div
														key={`${thread.id}-${thread.title}`}
														initial={{ opacity: 0 }}
														animate={{ opacity: 1 }}
														transition={{ duration: 0.3 }}
													>
														<Text weight="medium">{thread.title || `Chat with ${persona.name}`}</Text>
													</motion.div>
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
									</motion.div>
								))}
							</AnimatePresence>
						)}
					</Flex>
				</Box>
			</ScrollArea>
		</Flex>
	);
}
