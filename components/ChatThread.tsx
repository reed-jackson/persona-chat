import { Box, Button, Flex, ScrollArea, Text, TextArea } from "@radix-ui/themes";
import { IconSend } from "@tabler/icons-react";
import { type Message, type Thread, type Persona, type PersonaGroupWithMembers } from "@/lib/supabase";
import { useState, useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble";
import { subscribeToMessages } from "@/utils/supabase/realtime";
import { useAutoResizeTextArea } from "@/hooks/useAutoResizeTextArea";

type ChatThreadProps = {
	thread: Thread;
	persona?: Persona;
	group?: PersonaGroupWithMembers;
	messages: Message[];
	onNewMessage?: (message: Message) => void;
};

const MAX_RECURSIVE_RESPONSES = 3;

export default function ChatThread({ thread, group, messages, onNewMessage }: ChatThreadProps) {
	const [newMessage, setNewMessage] = useState("");
	const [error, setError] = useState<string>();
	const [sending, setSending] = useState(false);
	const [waitingForUser, setWaitingForUser] = useState(false);
	const [orchestratorReason, setOrchestratorReason] = useState<string>();
	const [recursionCount, setRecursionCount] = useState(0);
	const scrollAreaRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLTextAreaElement>(null);
	const lastMessageRef = useRef<Message | null>(null);
	const seenMessageIds = useRef<Set<string>>(new Set());

	const { handleTextAreaInput, textAreaStyles } = useAutoResizeTextArea();

	// Initialize seen message IDs from props
	useEffect(() => {
		seenMessageIds.current = new Set(messages.map((m) => m.id));
	}, []);

	// Helper to safely add new messages without duplicates
	const addNewMessage = (message: Message) => {
		if (!seenMessageIds.current.has(message.id)) {
			seenMessageIds.current.add(message.id);
			onNewMessage?.(message);
		}
	};

	useEffect(() => {
		// Scroll to bottom when messages change
		if (scrollAreaRef.current) {
			const scrollArea = scrollAreaRef.current;
			scrollArea.scrollTop = scrollArea.scrollHeight;
		}

		// Auto-focus input when AI responds
		const lastMessage = messages[messages.length - 1];
		if (lastMessage && lastMessage.sender !== "user" && lastMessage !== lastMessageRef.current) {
			inputRef.current?.focus();
			lastMessageRef.current = lastMessage;
			setWaitingForUser(false);
			setOrchestratorReason(undefined);
		}

		// Reset text area size to original using handleTextAreaInput
		if (inputRef.current) {
			handleTextAreaInput({ target: inputRef.current } as React.ChangeEvent<HTMLTextAreaElement>);
		}
	}, [messages, handleTextAreaInput]);

	// Subscribe to real-time message updates
	useEffect(() => {
		const unsubscribe = subscribeToMessages(thread.id, (message) => {
			addNewMessage(message);
		});

		// Cleanup subscription on unmount or thread change
		return () => {
			unsubscribe();
		};
	}, [thread.id]);

	const handleAIResponse = async (message: Message) => {
		// Don't continue if we've hit the recursion limit
		if (recursionCount >= MAX_RECURSIVE_RESPONSES) {
			setWaitingForUser(true);
			setOrchestratorReason("Maximum number of sequential AI responses reached. Your turn!");
			setRecursionCount(0);
			return;
		}

		try {
			// Add the AI message to the thread
			addNewMessage(message);

			// Check if another AI should respond
			const response = await fetch("/api/group-chat", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					threadId: thread.id,
					groupId: group?.id,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to process AI response");
			}

			if (data.shouldWaitForUser) {
				setWaitingForUser(true);
				setOrchestratorReason(data.reason);
				setRecursionCount(0);
			} else {
				setRecursionCount((prev) => prev + 1);
				await handleAIResponse(data.message);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to process AI response");
			setRecursionCount(0);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newMessage.trim() || sending) return;

		setSending(true);
		setError(undefined);
		setWaitingForUser(false);
		setOrchestratorReason(undefined);
		setRecursionCount(0);

		try {
			// Use group-chat route if group is present, otherwise use chat route
			const route = group ? "/api/group-chat" : "/api/chat";
			const response = await fetch(route, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					threadId: thread.id,
					content: newMessage.trim(),
					...(group && { groupId: group.id }),
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to send message");
			}

			setNewMessage("");

			if (group) {
				if (data.shouldWaitForUser) {
					setWaitingForUser(true);
					setOrchestratorReason(data.reason);
				} else {
					await handleAIResponse(data.message);
				}
			} else {
				onNewMessage?.(data.message);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to send message");
		} finally {
			setSending(false);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSubmit(e);
		}
	};

	return (
		<Flex direction="column" className="h-full">
			<ScrollArea ref={scrollAreaRef} type="hover" scrollbars="vertical" className="flex-1">
				<Box p="4">
					<Flex direction="column" gap="4">
						{messages.length === 0 ? (
							<Text color="gray" align="center">
								No messages yet. Start the conversation!
							</Text>
						) : (
							messages.map((message, i) => (
								<MessageBubble
									key={message.id}
									message={message}
									isUser={message.sender === "user"}
									persona={message.sender === "user" ? undefined : group?.members.find((m) => m.name === message.sender)}
									showAvatar={i === 0 || messages[i - 1]?.sender !== message.sender || message.sender !== "user"}
								/>
							))
						)}
						{waitingForUser && orchestratorReason && (
							<Text size="1" color="gray" align="center" mt="2">
								{orchestratorReason}
							</Text>
						)}
					</Flex>
				</Box>
			</ScrollArea>

			<Box p="4" style={{ borderTop: "1px solid var(--gray-6)" }}>
				{error && (
					<Text color="red" size="2" mb="2">
						{error}
					</Text>
				)}
				<form onSubmit={handleSubmit}>
					<Flex gap="2">
						<TextArea
							ref={inputRef}
							value={newMessage}
							onChange={(e) => {
								setNewMessage(e.target.value);
								handleTextAreaInput(e);
							}}
							onKeyDown={handleKeyDown}
							placeholder="Type your message..."
							style={textAreaStyles}
							rows={1}
						/>
						<Button type="submit" disabled={!newMessage.trim() || sending}>
							<IconSend size={16} />
						</Button>
					</Flex>
				</form>
			</Box>
		</Flex>
	);
}
