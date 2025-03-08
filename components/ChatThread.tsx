import { Box, Button, Flex, ScrollArea, Text, TextArea } from "@radix-ui/themes";
import { IconSend } from "@tabler/icons-react";
import { type Message, type Thread, type Persona } from "@/lib/supabase";
import { useState, useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble";
import { subscribeToMessages, subscribeToThreadUpdates } from "@/utils/supabase/realtime";
import { useAutoResizeTextArea } from "@/hooks/useAutoResizeTextArea";

type ChatThreadProps = {
	thread: Thread;
	persona: Persona;
	messages: Message[];
	onNewMessage?: (message: Message) => void;
	onThreadUpdate?: (thread: Thread) => void;
};

export default function ChatThread({ thread, messages, onNewMessage, onThreadUpdate }: ChatThreadProps) {
	const [newMessage, setNewMessage] = useState("");
	const [error, setError] = useState<string>();
	const [sending, setSending] = useState(false);
	const [previousTitle, setPreviousTitle] = useState(thread.title);
	const scrollAreaRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLTextAreaElement>(null);
	const lastMessageRef = useRef<Message | null>(null);

	const { handleTextAreaInput, textAreaStyles } = useAutoResizeTextArea();

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

		// Reset text area size to original using handleTextAreaInput
		if (inputRef.current) {
			handleTextAreaInput({ target: inputRef.current } as React.ChangeEvent<HTMLTextAreaElement>);
		}
	}, [messages, handleTextAreaInput]);

	// Track title changes for animation
	useEffect(() => {
		if (thread.title !== previousTitle) {
			setPreviousTitle(thread.title);
		}
	}, [thread.title, previousTitle]);

	// Subscribe to real-time message updates
	useEffect(() => {
		const unsubscribeMessages = subscribeToMessages(thread.id, (message) => {
			onNewMessage?.(message);
		});

		const unsubscribeThread = subscribeToThreadUpdates(thread.id, (updatedThread) => {
			onThreadUpdate?.(updatedThread);
		});

		// Cleanup subscriptions on unmount or thread change
		return () => {
			unsubscribeMessages();
			unsubscribeThread();
		};
	}, [thread.id, onNewMessage, onThreadUpdate]);

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

			const data = await response.json();

			// If we got an updated title, update the thread
			if (data.updatedTitle && onThreadUpdate) {
				onThreadUpdate({
					...thread,
					title: data.updatedTitle,
				});
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
		<Flex direction="column" className="h-full" position="relative">
			{error && (
				<Box
					px="4"
					py="2"
					position="absolute"
					top="0"
					left="0"
					right="0"
					style={{ zIndex: 1000, backgroundColor: "var(--red-3)" }}
				>
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
					<TextArea
						className="flex-1"
						placeholder="Type your message..."
						value={newMessage}
						onChange={(e) => {
							setNewMessage(handleTextAreaInput(e));
						}}
						onKeyDown={handleKeyPress}
						disabled={sending}
						ref={inputRef}
						style={textAreaStyles}
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
