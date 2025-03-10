import { Box, Button, Flex, IconButton, ScrollArea, Text, TextArea } from "@radix-ui/themes";
import { IconSend, IconShare } from "@tabler/icons-react";
import { type Message, type Thread, type Persona } from "@/lib/supabase";
import { useState, useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble";
import { subscribeToMessages, subscribeToThreadUpdates } from "@/utils/supabase/realtime";
import { useAutoResizeTextArea } from "@/hooks/useAutoResizeTextArea";
import { createClient } from "@/utils/supabase/client";

type ChatThreadProps = {
	thread: Thread;
	persona: Persona;
	messages: Message[];
	onNewMessage?: (message: Message) => void;
	onThreadUpdate?: (thread: Thread) => void;
};

export default function ChatThread({ thread, persona, messages, onNewMessage, onThreadUpdate }: ChatThreadProps) {
	const [newMessage, setNewMessage] = useState("");
	const [error, setError] = useState<string>();
	const [success, setSuccess] = useState<string>();
	const [sending, setSending] = useState(false);
	const [previousTitle, setPreviousTitle] = useState(thread.title);
	const [isSharing, setIsSharing] = useState(false);
	const scrollAreaRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLTextAreaElement>(null);
	const lastMessageRef = useRef<Message | null>(null);
	const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const { handleTextAreaInput, textAreaStyles } = useAutoResizeTextArea();

	// Clear notifications on unmount
	useEffect(() => {
		return () => {
			if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
			if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
		};
	}, []);

	// Handle error display and auto-dismiss
	const showError = (message: string) => {
		setError(message);
		setSuccess(undefined);
		if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
		errorTimeoutRef.current = setTimeout(() => setError(undefined), 5000);
	};

	// Handle success display and auto-dismiss
	const showSuccess = (message: string) => {
		setSuccess(message);
		setError(undefined);
		if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
		successTimeoutRef.current = setTimeout(() => setSuccess(undefined), 5000);
	};

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

			console.log("data: ", data);

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

	const handleShare = async () => {
		setIsSharing(true);
		const supabase = createClient();

		try {
			// First check if this thread already has a public version
			const { data: existingPublicThread, error: fetchError } = await supabase
				.from("public_threads")
				.select("id")
				.eq("thread_id", thread.id)
				.single();

			if (fetchError && fetchError.code !== "PGRST116") {
				// PGRST116 is "not found" error
				throw fetchError;
			}

			let publicThreadId;

			if (existingPublicThread) {
				// Use existing public thread
				publicThreadId = existingPublicThread.id;
			} else {
				// Create new public thread
				const { data: threadMessages, error: messagesError } = await supabase
					.from("messages")
					.select("*")
					.eq("thread_id", thread.id)
					.order("created_at", { ascending: true });

				if (messagesError) throw messagesError;

				const { data: publicThread, error: insertError } = await supabase
					.from("public_threads")
					.insert({
						thread_id: thread.id,
						title: thread.title,
						messages: threadMessages,
						persona_details: {
							name: persona.name,
							title: persona.title,
							experience: persona.experience,
							industry: persona.industry,
						},
						created_by: (await supabase.auth.getUser()).data.user?.id || "",
					})
					.select()
					.single();

				if (insertError) throw insertError;
				publicThreadId = publicThread.id;

				// Update the thread with the public_id
				await supabase.from("threads").update({ public_id: publicThread.id }).eq("id", thread.id);
			}

			// Create and copy the shareable URL
			const shareUrl = `${window.location.origin}/public/thread/${publicThreadId}`;
			await navigator.clipboard.writeText(shareUrl);
			showSuccess("Share link copied to clipboard!");
		} catch (err) {
			console.error("Share error:", err);
			showError(err instanceof Error ? err.message : "Failed to create share link");
		} finally {
			setIsSharing(false);
		}
	};

	return (
		<Flex direction="column" width="100%" height="100%" position="relative">
			{/* Header */}
			<Box px="4" py="3" style={{ borderBottom: "1px solid var(--gray-6)", height: "var(--space-9)" }}>
				<Flex justify="between" align="center" height="100%">
					<Text size="3" weight="medium" className="truncate">
						{thread.title}
					</Text>
					<IconButton size="2" variant="ghost" onClick={handleShare} disabled={isSharing}>
						<IconShare size={16} />
					</IconButton>
				</Flex>
			</Box>

			{/* Notifications */}
			{error && (
				<Box
					px="4"
					py="2"
					position="absolute"
					top="var(--space-9)"
					left="0"
					right="0"
					style={{
						zIndex: 1000,
						backgroundColor: "var(--red-3)",
						transition: "opacity 150ms ease-in-out",
					}}
				>
					<Text color="red" size="2">
						{error}
					</Text>
				</Box>
			)}

			{success && (
				<Box
					px="4"
					py="2"
					position="absolute"
					top="var(--space-9)"
					left="0"
					right="0"
					style={{
						zIndex: 1000,
						backgroundColor: "var(--green-3)",
						transition: "opacity 150ms ease-in-out",
					}}
				>
					<Text color="green" size="2">
						{success}
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
