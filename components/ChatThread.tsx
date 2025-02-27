import { Box, Button, Flex, ScrollArea, Text, TextField } from "@radix-ui/themes";
import { IconSend } from "@tabler/icons-react";
import { type Message, type Thread, type Persona } from "@/lib/supabase";
import { useState, useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble";
import { subscribeToMessages } from "@/utils/supabase/realtime";

type ChatThreadProps = {
	thread: Thread;
	persona: Persona;
	messages: Message[];
	onNewMessage?: (message: Message) => void;
};

export default function ChatThread({ thread, persona, messages, onNewMessage }: ChatThreadProps) {
	const [newMessage, setNewMessage] = useState("");
	const [error, setError] = useState<string>();
	const [sending, setSending] = useState(false);
	const scrollAreaRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const lastMessageRef = useRef<Message | null>(null);

	useEffect(() => {
		// Scroll to bottom when messages change
		if (scrollAreaRef.current) {
			const scrollArea = scrollAreaRef.current;
			scrollArea.scrollTop = scrollArea.scrollHeight;
		}

		// Auto-focus input when AI responds
		const lastMessage = messages[messages.length - 1];
		if (lastMessage && lastMessage.sender === "persona" && lastMessage !== lastMessageRef.current) {
			inputRef.current?.focus();
			lastMessageRef.current = lastMessage;
		}
	}, [messages]);

	// Subscribe to real-time message updates
	useEffect(() => {
		const unsubscribe = subscribeToMessages(thread.id, (message) => {
			onNewMessage?.(message);
		});

		// Cleanup subscription on unmount or thread change
		return () => {
			unsubscribe();
		};
	}, [thread.id, onNewMessage]);

	const handleSend = async () => {
		if (!newMessage.trim() || sending) return;

		setSending(true);
		setError(undefined);

		try {
			// Send to API which will save both user and AI messages
			const response = await fetch("/api/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					threadId: thread.id,
					content: newMessage.trim(),
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to get persona response");
			}

			setNewMessage("");
		} catch (err) {
			console.error("Chat error:", err);
			setError(err instanceof Error ? err.message : "Failed to send message");
		} finally {
			setSending(false);
		}
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	return (
		<Flex direction="column" className="h-full">
			<Box p="4" style={{ display: "none", borderBottom: "1px solid var(--gray-6)" }}>
				<Flex justify="between" align="center">
					<Box>
						<Box>
							<Flex align="baseline" gap="2">
								<Box>
									<Text size="5" weight="bold">
										{persona.name}
									</Text>
								</Box>
								<Box>
									<Text size="2" color="gray">
										{thread.title}
									</Text>
								</Box>
							</Flex>
						</Box>
						<Text size="2" color="gray">
							{persona.experience}
						</Text>
					</Box>
				</Flex>
			</Box>

			{error && (
				<Box px="4" py="2">
					<Text color="red" size="2">
						{error}
					</Text>
				</Box>
			)}

			<ScrollArea
				ref={scrollAreaRef}
				type="hover"
				scrollbars="vertical"
				className="flex-1"
				style={{ position: "relative" }}
			>
				<Box p="4">
					<Flex direction="column" gap="2" width={"100%"}>
						{messages.length === 0 ? (
							<Box className="text-center py-8">
								<Text color="gray">No messages yet. Start the conversation!</Text>
							</Box>
						) : (
							messages.map((message) => (
								<MessageBubble key={message.id} message={message} isUser={message.sender === "user"} />
							))
						)}
					</Flex>
				</Box>
			</ScrollArea>

			<Box p="4" style={{ borderTop: "1px solid var(--gray-6)" }}>
				<Flex gap="2">
					<TextField.Root
						className="flex-1"
						placeholder="Type your message..."
						value={newMessage}
						onChange={(e) => setNewMessage(e.target.value)}
						onKeyDown={handleKeyPress}
						disabled={sending}
						ref={inputRef}
					/>
					<Button onClick={handleSend} disabled={sending || !newMessage.trim()}>
						<IconSend size={16} />
						Send
					</Button>
				</Flex>
			</Box>
		</Flex>
	);
}
