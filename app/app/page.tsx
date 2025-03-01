"use client";

import PersonaList from "@/components/PersonaList";
import PersonaThreads from "@/components/PersonaThreads";
import { Box, Dialog, Flex, IconButton, Text, VisuallyHidden } from "@radix-ui/themes";
import { useEffect, useState } from "react";
import {
	type Persona,
	type Thread,
	getPersonas,
	getThreads,
	getWorkplaceContext,
	WorkplaceContext,
} from "@/lib/supabase";
import { IconMessageBolt, IconUserPlus } from "@tabler/icons-react";
import PersonaForm from "@/components/PersonaForm";
import { useRouter, useParams } from "next/navigation";
import BulkMessage from "@/components/BulkMessage";

export default function AppPage() {
	const params = useParams();
	const threadId = typeof params?.id === "string" ? params.id : undefined;
	const [selectedPersona, setSelectedPersona] = useState<Persona>();
	const [personas, setPersonas] = useState<Persona[]>([]);
	const [threads, setThreads] = useState<Thread[]>([]);
	const [isNewPersonaOpen, setIsNewPersonaOpen] = useState(false);
	const [isBulkMessageOpen, setIsBulkMessageOpen] = useState(false);
	const [editingPersona, setEditingPersona] = useState<Persona>();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string>();
	const [workplaceContext, setWorkplaceContext] = useState<WorkplaceContext>();
	const router = useRouter();

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
			router.push("/app");
		}
	};

	const handleNewThread = (thread: Thread) => {
		setThreads((prev) => [thread, ...prev]);
		router.push(`/app/thread/${thread.id}`);
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

	return (
		<Flex className="h-full">
			{/* Left sidebar with personas */}
			<Box display={{ initial: "none", md: "block" }} width={"320px"} style={{ borderRight: "1px solid var(--gray-6)" }}>
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
								onSelectPersona={setSelectedPersona}
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
				<Box display={{ initial: "none", md: "block" }} width="280px" style={{ borderRight: "1px solid var(--gray-6)" }}>
					<PersonaThreads
						persona={selectedPersona}
						threads={threads}
						onNewThread={handleNewThread}
						onSelectThread={(thread) => router.push(`/app/thread/${thread.id}`)}
						selectedThreadId={threadId}
					/>
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
	);
}
