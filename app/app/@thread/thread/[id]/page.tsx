"use client";

import ChatThread from "@/components/ChatThread";
import { Box, Flex, Heading } from "@radix-ui/themes";
import { useEffect, useState } from "react";
import { type Message, type Thread, type Persona, getMessages, getThreads, getPersonas } from "@/lib/supabase";

export default function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
	const [thread, setThread] = useState<Thread>();
	const [persona, setPersona] = useState<Persona>();
	const [messages, setMessages] = useState<Message[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string>();

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
		<Flex direction="column" className="h-full">
			<Flex px="4" py="3" align="center" style={{ borderBottom: "1px solid var(--gray-6)", height: "var(--space-9)" }}>
				<Heading size="3">{thread.title || `Chat with ${persona.name}`}</Heading>
			</Flex>
			<Box className="flex-1 min-h-0 overflow-y-auto">
				<ChatThread thread={thread} persona={persona} messages={messages} onNewMessage={handleNewMessage} />
			</Box>
		</Flex>
	);
}
