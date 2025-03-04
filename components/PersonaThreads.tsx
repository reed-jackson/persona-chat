import { Avatar, Box, Flex, IconButton, ScrollArea, Text, TextField, Button } from "@radix-ui/themes";
import { IconMessagePlus, IconEdit } from "@tabler/icons-react";
import { type Thread, type Persona, type PersonaGroupWithMembers, createThread, updateThread } from "@/lib/supabase";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

type PersonaThreadsProps = {
	persona?: Persona;
	group?: PersonaGroupWithMembers;
	threads: Thread[];
	onSelectThread: (thread: Thread) => void;
	onNewThread: (thread: Thread) => void;
	selectedThreadId?: string;
};

export default function PersonaThreads({
	persona,
	group,
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
			if (!persona && !group) return;

			// For group threads, select an initial responder based on the first available persona
			// This persona will be the first to respond in the group chat
			const initialResponderId = null;
			const threadTitle = persona ? `Chat with ${persona.name}` : `Group Chat: ${group!.name}`;

			const thread = await createThread(initialResponderId, threadTitle, group?.id);
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
						{persona ? (
							<Avatar size="2" fallback={persona.name[0]} color="blue" className="cursor-pointer" radius="full" />
						) : group ? (
							<Flex gap="1">
								{group.members.slice(0, 3).map((member) => (
									<Avatar
										key={member.id}
										size="2"
										fallback={member.name[0]}
										color="blue"
										className="cursor-pointer"
										radius="full"
									/>
								))}
								{group.members.length > 3 && (
									<Text size="2" color="gray">
										+{group.members.length - 3}
									</Text>
								)}
							</Flex>
						) : null}
						<Text size="4" weight="bold">
							{persona ? persona.name : group ? group.name : ""}
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
								<Box
									key={thread.id}
									className={`cursor-pointer transition-colors hover:bg-gray-2 rounded-lg ${
										selectedThreadId === thread.id ? "bg-gray-3" : ""
									}`}
									onClick={() => onSelectThread(thread)}
								>
									<Flex gap="3" p="3" align="center">
										<Box className="flex-1 min-w-0">
											<Flex justify="between" align="center">
												{editingThread?.id === thread.id ? (
													<Flex gap="2" className="flex-1">
														<TextField.Root
															value={newTitle}
															onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTitle(e.target.value)}
															placeholder="Thread title"
														/>
														<Button
															size="1"
															onClick={(e) => {
																e.stopPropagation();
																handleRenameThread(thread);
															}}
														>
															Save
														</Button>
													</Flex>
												) : (
													<>
														<Text weight="medium" className="truncate">
															{thread.title}
														</Text>
														<IconButton
															size="1"
															variant="ghost"
															onClick={(e) => {
																e.stopPropagation();
																setEditingThread(thread);
																setNewTitle(thread.title);
															}}
														>
															<IconEdit size={16} />
														</IconButton>
													</>
												)}
											</Flex>
											<Text size="1" color="gray">
												{formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
											</Text>
										</Box>
									</Flex>
								</Box>
							))
						)}
					</Flex>
				</Box>
			</ScrollArea>
		</Flex>
	);
}
