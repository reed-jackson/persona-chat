"use client";

import ChatThread from "@/components/ChatThread";
import { Box, Button, Dialog, Flex, Heading, IconButton, Text, TextField } from "@radix-ui/themes";
import { IconCopy, IconShare } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { type Message, type Thread, type Persona, getMessages, getThreads, getPersonas } from "@/lib/supabase";
import { createClient } from "@/utils/supabase/client";

type PublicThread = {
	id: string;
	thread_id: string;
	title: string;
	persona_details: {
		name: string;
		age: number;
		experience: string;
		personality: string;
		pain_points: string;
		values: string;
	};
	messages: Message[];
	created_at: string;
	updated_at: string;
};

export default function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
	const [thread, setThread] = useState<Thread>();
	const [persona, setPersona] = useState<Persona>();
	const [messages, setMessages] = useState<Message[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string>();
	const [shareDialogOpen, setShareDialogOpen] = useState(false);
	const [publicLink, setPublicLink] = useState<string>();
	const [copying, setCopying] = useState(false);
	const [existingPublicThread, setExistingPublicThread] = useState<PublicThread>();
	const [updating, setUpdating] = useState(false);

	useEffect(() => {
		const loadThread = async () => {
			try {
				const id = (await params).id;

				// Get all personas first to find the persona ID
				const allPersonas = await getPersonas();

				// Get all threads for all personas and find the one we want
				const allThreads = await Promise.all(allPersonas.map((p) => getThreads(p.id))).then((threadArrays) =>
					threadArrays.flat()
				);

				const threadData = allThreads.find((t) => t.id === id);
				if (!threadData) {
					throw new Error("Thread not found");
				}
				setThread(threadData);

				const personaData = allPersonas.find((p) => p.id === threadData.persona_id);
				if (!personaData) {
					throw new Error("Persona not found");
				}

				const messagesData = await getMessages(id);

				setMessages(messagesData);
				setPersona(personaData);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Failed to load thread");
			} finally {
				setLoading(false);
			}
		};
		loadThread();
	}, [params]);

	const handleNewMessage = (message: Message) => {
		setMessages((prev) => [...prev, message]);
	};

	const handleShare = async () => {
		if (!thread || !persona || !messages.length) return;

		try {
			const supabase = createClient();

			// Get the current user's ID
			const {
				data: { user },
				error: userError,
			} = await supabase.auth.getUser();
			if (userError || !user) throw new Error("Not authenticated");

			// Check if public thread already exists
			const { data: existingThread } = await supabase
				.from("public_threads")
				.select("*")
				.eq("thread_id", thread.id)
				.single();

			if (existingThread) {
				setExistingPublicThread(existingThread);
				setPublicLink(`${window.location.origin}/public/thread/${existingThread.id}`);
				setShareDialogOpen(true);
				return;
			}

			// Create new public thread
			const publicThread = {
				thread_id: thread.id,
				title: thread.title || `Chat with ${persona.name}`,
				persona_details: {
					name: persona.name,
					age: persona.age,
					experience: persona.experience,
					personality: persona.personality,
					pain_points: persona.pain_points,
					values: persona.values,
				},
				messages: messages,
				created_by: user.id,
			};

			const { data: newPublicThread, error: createError } = await supabase
				.from("public_threads")
				.insert(publicThread)
				.select()
				.single();

			if (createError) throw createError;

			setExistingPublicThread(newPublicThread);
			setPublicLink(`${window.location.origin}/public/thread/${newPublicThread.id}`);
			setShareDialogOpen(true);
		} catch (err) {
			console.error("Share error:", err);
			setError(err instanceof Error ? err.message : "Failed to generate share link");
		}
	};

	const handleUpdatePublicThread = async () => {
		if (!thread || !persona || !messages.length || !existingPublicThread) return;

		setUpdating(true);
		try {
			const supabase = createClient();

			const updatedThread = {
				title: thread.title || `Chat with ${persona.name}`,
				persona_details: {
					name: persona.name,
					age: persona.age,
					experience: persona.experience,
					personality: persona.personality,
					pain_points: persona.pain_points,
					values: persona.values,
				},
				messages: messages,
			};

			const { error: updateError } = await supabase
				.from("public_threads")
				.update(updatedThread)
				.eq("id", existingPublicThread.id);

			if (updateError) throw updateError;

			setExistingPublicThread({
				...existingPublicThread,
				...updatedThread,
				updated_at: new Date().toISOString(),
			});
		} catch (err) {
			console.error("Update error:", err);
			setError(err instanceof Error ? err.message : "Failed to update public thread");
		} finally {
			setUpdating(false);
		}
	};

	const handleCopyLink = async () => {
		if (!publicLink) return;

		setCopying(true);
		try {
			await navigator.clipboard.writeText(publicLink);
			setTimeout(() => setCopying(false), 1000);
		} catch (err) {
			console.error("Copy error:", err);
			setCopying(false);
		}
	};

	if (error) {
		return (
			<Flex align="center" justify="center" flexGrow="1" className="h-full">
				<Box>
					<Heading color="red" size="3" mb="2">
						Error
					</Heading>
					<p>{error}</p>
				</Box>
			</Flex>
		);
	}

	if (loading || !thread || !persona) {
		return (
			<Flex align="center" justify="center" flexGrow="1" className="h-full">
				<p>Loading thread...</p>
			</Flex>
		);
	}

	return (
		<Flex direction="column" className="h-full" width={"100%"}>
			<Flex
				px="4"
				py="3"
				align="center"
				justify="between"
				style={{ borderBottom: "1px solid var(--gray-6)", height: "var(--space-9)" }}
			>
				<Box ml={{ initial: "8", md: "0" }}>
					<Heading size="3">{thread.title || `Chat with ${persona.name}`}</Heading>
				</Box>
				<IconButton onClick={handleShare} variant="ghost">
					<IconShare size={16} />
				</IconButton>
			</Flex>
			<Box className="flex-1 min-h-0 overflow-y-auto">
				<ChatThread thread={thread} persona={persona} messages={messages} onNewMessage={handleNewMessage} />
			</Box>

			<Dialog.Root open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
				<Dialog.Content>
					<Dialog.Title>Share Thread</Dialog.Title>
					<Box my="4">
						<Text as="p" size="2" mb="2">
							Anyone with this link can view this thread and persona details:
						</Text>
						<Flex gap="2" width="100%">
							<TextField.Root
								value={publicLink}
								readOnly
								onClick={(e) => e.currentTarget.select()}
								style={{ width: "100%" }}
							/>
							<Button onClick={handleCopyLink} disabled={copying}>
								<IconCopy size={16} />
								{copying ? "Copied!" : "Copy"}
							</Button>
						</Flex>
						{existingPublicThread && (
							<Box mt="4">
								<Text as="p" size="2" color="gray">
									Last updated: {new Date(existingPublicThread.updated_at).toLocaleString()}
								</Text>
								<Button mt="2" variant="soft" onClick={handleUpdatePublicThread} disabled={updating}>
									{updating ? "Updating..." : "Update Public Thread"}
								</Button>
							</Box>
						)}
					</Box>
					<Flex gap="3" mt="4" justify="end">
						<Dialog.Close>
							<Button variant="soft" color="gray">
								Close
							</Button>
						</Dialog.Close>
					</Flex>
				</Dialog.Content>
			</Dialog.Root>
		</Flex>
	);
}
