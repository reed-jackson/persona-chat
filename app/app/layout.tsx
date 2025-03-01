"use client";

import "@radix-ui/themes/styles.css";
import { Box, Flex } from "@radix-ui/themes";
import MobileMenu from "@/components/MobileMenu";
import { useEffect, useState } from "react";
import { type Persona, type Thread, getPersonas, getThreads, createThread } from "@/lib/supabase";

export default function AppLayout({ children, thread }: { children: React.ReactNode; thread: React.ReactNode }) {
	const [personas, setPersonas] = useState<Persona[]>([]);
	const [threads, setThreads] = useState<Thread[]>([]);
	const [selectedPersona, setSelectedPersona] = useState<Persona>();

	useEffect(() => {
		loadPersonas();
	}, []);

	useEffect(() => {
		if (selectedPersona) {
			loadThreads(selectedPersona.id);
		}
	}, [selectedPersona]);

	const loadPersonas = async () => {
		try {
			const data = await getPersonas();
			setPersonas(data);
		} catch (err) {
			console.error("Failed to load personas:", err);
		}
	};

	const loadThreads = async (personaId: string) => {
		try {
			const data = await getThreads(personaId);
			setThreads(data);
		} catch (err) {
			console.error("Failed to load threads:", err);
		}
	};

	const handleNewThread = async (persona: Persona) => {
		try {
			const thread = await createThread(persona.id, `Chat with ${persona.name}`);
			setThreads((prev) => [thread, ...prev]);
			return thread;
		} catch (err) {
			console.error("Failed to create thread:", err);
			throw err;
		}
	};

	return (
		<Flex width="100%" className="overflow-hidden" position="fixed" top="0" left="0" right="0" bottom="0">
			<Box position="absolute" top="3" left="3" display={{ initial: "block", md: "none" }}>
				<MobileMenu
					personas={personas}
					threads={threads}
					selectedPersonaId={selectedPersona?.id}
					onSelectPersona={setSelectedPersona}
					onNewPersona={() => {
						// This will be handled by the parent component's dialog
					}}
					onNewThread={handleNewThread}
				/>
			</Box>
			{children}
			{thread}
		</Flex>
	);
}
