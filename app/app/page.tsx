"use client";

import PersonaList from "@/components/PersonaList";
import PersonaThreads from "@/components/PersonaThreads";
import { Box, Dialog, Flex, IconButton, Text, VisuallyHidden } from "@radix-ui/themes";
import { Suspense, useEffect, useState } from "react";
import {
	type Persona,
	type Thread,
	getPersonas,
	getThreads,
	getWorkplaceContext,
	WorkplaceContext,
	createThread,
	getMessages,
	Message,
} from "@/lib/supabase";
import { IconMessageBolt, IconUserPlus } from "@tabler/icons-react";
import PersonaForm from "@/components/PersonaForm";
import { useRouter, useSearchParams } from "next/navigation";
import BulkMessage from "@/components/BulkMessage";
import ChatThread from "@/components/ChatThread";

export default function AppPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const threadId = searchParams.get("thread");
	const personaId = searchParams.get("persona");

	const [selectedPersona, setSelectedPersona] = useState<Persona>();
	const [personas, setPersonas] = useState<Persona[]>([]);
	const [threads, setThreads] = useState<Thread[]>([]);
	const [messages, setMessages] = useState<Message[]>([]);
	const [isNewPersonaOpen, setIsNewPersonaOpen] = useState(false);
	const [isBulkMessageOpen, setIsBulkMessageOpen] = useState(false);
	const [editingPersona, setEditingPersona] = useState<Persona>();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string>();
	const [workplaceContext, setWorkplaceContext] = useState<WorkplaceContext>();

	// Load personas and workplace context on mount
	useEffect(() => {
		loadPersonas();
		loadWorkplaceContext();
	}, []);

	// Load threads when persona is selected
	useEffect(() => {
		if (selectedPersona) {
			loadThreads(selectedPersona.id);
		} else {
			setThreads([]);
		}
	}, [selectedPersona]);

	// Update selected persona when personaId changes in URL
	useEffect(() => {
		if (personaId) {
			const persona = personas.find((p) => p.id === personaId);
			if (persona) {
				setSelectedPersona(persona);
			}
		}
	}, [personaId, personas]);

	const loadPersonas = async () => {
		try {
			const data = await getPersonas();
			setPersonas(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load personas");
		} finally {
			setLoading(false);
		}
	};

	const loadThreads = async (personaId: string) => {
		try {
			const data = await getThreads(personaId);
			setThreads(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load threads");
		}
	};

	const loadWorkplaceContext = async () => {
		try {
			const data = await getWorkplaceContext();
			setWorkplaceContext(data || undefined);
		} catch (err) {
			console.error("Failed to load workplace context:", err);
		}
	};

	const handlePersonaCreate = (newPersona: Persona) => {
		setPersonas((prev) => [newPersona, ...prev]);
		setSelectedPersona(newPersona);
		setIsNewPersonaOpen(false);
		updateURL(newPersona.id);
	};

	const handlePersonaUpdate = (updatedPersona: Persona) => {
		setPersonas((prev) => prev.map((p) => (p.id === updatedPersona.id ? updatedPersona : p)));
		setSelectedPersona(updatedPersona);
		setEditingPersona(undefined);
	};

	const handlePersonaDelete = (deletedId: string) => {
		setPersonas((prev) => prev.filter((p) => p.id !== deletedId));
		if (selectedPersona?.id === deletedId) {
			setSelectedPersona(undefined);
			updateURL();
		}
	};

	const handleNewThread = async (persona: Persona) => {
		try {
			const thread = await createThread(persona.id, `Chat with ${persona.name}`);
			setThreads((prev) => [thread, ...prev]);
			setMessages([]);
			updateURL(persona.id, thread.id);
			return thread;
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to create thread");
			throw err;
		}
	};

	const handleWorkplaceContextSave = (data: WorkplaceContext) => {
		setWorkplaceContext(data);
	};

	const handleBulkMessage = async (selectedPersonaIds: string[], message: string) => {
		try {
			await handleBulkMessage?.(selectedPersonaIds, message);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to send bulk messages");
			throw err;
		}
	};

	const updateURL = (newPersonaId?: string, newThreadId?: string) => {
		const params = new URLSearchParams();
		if (newPersonaId) params.set("persona", newPersonaId);
		if (newThreadId) params.set("thread", newThreadId);
		router.push(`/app?${params.toString()}`);
	};

	const handleSelectPersona = (persona: Persona) => {
		setSelectedPersona(persona);
		updateURL(persona.id || undefined);
	};

	const handleSelectThread = async (thread: Thread) => {
		updateURL(thread.persona_id || undefined, thread.id || undefined);

		setMessages([]);
		const messages = await getMessages(thread.id);
		setMessages(messages);
	};

	const handleNewMessage = (message: Message) => {
		setMessages((prev) => [...prev, message]);
	};

	return (
		<Suspense fallback={<div>Loading...</div>}>
			<Flex width="100%" height="100%">
				{/* Left sidebar with personas */}
				<Box display={{ initial: "none", md: "block" }} width={"340px"} style={{ borderRight: "1px solid var(--gray-6)" }}>
					<Flex direction="column" className="h-full">
						<Box px="4" py="3" style={{ borderBottom: "1px solid var(--gray-6)", height: "var(--space-9)" }}>
							<Flex justify="between" align="center" height="100%">
								<img src="/personachat.svg" alt="logo" width={109} height={40} />

								<Flex gap="2" align="center">
									<Dialog.Root open={isBulkMessageOpen} onOpenChange={setIsBulkMessageOpen}>
										<Dialog.Trigger>
											<IconButton variant="soft" size="2">
												<IconMessageBolt size={16} />
											</IconButton>
										</Dialog.Trigger>
										<Dialog.Content>
											<Dialog.Title>Bulk Message</Dialog.Title>
											{/* BulkMessageForm component will be added here */}
										</Dialog.Content>
									</Dialog.Root>
									<Dialog.Root open={isNewPersonaOpen} onOpenChange={setIsNewPersonaOpen}>
										<Dialog.Trigger>
											<IconButton variant="soft" size="2">
												<IconUserPlus size={16} />
											</IconButton>
										</Dialog.Trigger>
										<Dialog.Content>
											<VisuallyHidden>
												<Dialog.Title>Create Persona</Dialog.Title>
											</VisuallyHidden>
											<PersonaForm onSuccess={handlePersonaCreate} onCancel={() => setIsNewPersonaOpen(false)} />
										</Dialog.Content>
									</Dialog.Root>
								</Flex>
							</Flex>
						</Box>
						<Box className="flex-1 overflow-y-auto">
							{error ? (
								<Text color="red" size="2" className="p-4">
									{error}
								</Text>
							) : loading ? (
								<Text color="gray" className="p-4">
									Loading personas...
								</Text>
							) : (
								<PersonaList
									personas={personas}
									selectedPersonaId={selectedPersona?.id}
									onSelectPersona={handleSelectPersona}
									onEditPersona={setEditingPersona}
									onDeletePersona={handlePersonaDelete}
									workplaceContext={workplaceContext}
									onWorkplaceContextSave={handleWorkplaceContextSave}
								/>
							)}
						</Box>
					</Flex>
				</Box>

				{/* Middle panel with threads */}
				{selectedPersona && (
					<Box
						display={{ initial: "none", md: "block" }}
						width="280px"
						flexShrink={"0"}
						style={{ borderRight: "1px solid var(--gray-6)" }}
					>
						<PersonaThreads
							persona={selectedPersona}
							threads={threads}
							onNewThread={() => handleNewThread(selectedPersona)}
							onSelectThread={handleSelectThread}
							selectedThreadId={threadId || undefined}
						/>
					</Box>
				)}

				{/* Right panel with chat thread */}
				{threadId && selectedPersona && (
					<Box width="100%">
						{(() => {
							const thread = threads.find((t) => t.id === threadId);
							if (!thread) return null;
							return (
								<ChatThread messages={messages} onNewMessage={handleNewMessage} thread={thread} persona={selectedPersona} />
							);
						})()}
					</Box>
				)}

				{/* Edit Persona Dialog */}
				<Dialog.Root open={!!editingPersona} onOpenChange={(open) => !open && setEditingPersona(undefined)}>
					<Dialog.Content>
						<VisuallyHidden>
							<Dialog.Title>Edit Persona</Dialog.Title>
						</VisuallyHidden>
						{editingPersona && (
							<PersonaForm
								persona={editingPersona}
								onSuccess={handlePersonaUpdate}
								onCancel={() => setEditingPersona(undefined)}
							/>
						)}
					</Dialog.Content>
				</Dialog.Root>

				<BulkMessage
					personas={personas}
					onSendMessages={handleBulkMessage}
					open={isBulkMessageOpen}
					onOpenChange={setIsBulkMessageOpen}
				/>
			</Flex>
		</Suspense>
	);
}
