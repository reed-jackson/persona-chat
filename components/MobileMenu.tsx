import { Avatar, Box, Flex, IconButton, Popover, ScrollArea, Text } from "@radix-ui/themes";
import { IconArrowBarRight, IconMenu2, IconMessagePlus, IconUserPlus } from "@tabler/icons-react";
import { useState } from "react";
import { type Persona, type Thread } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

type MobileMenuProps = {
	personas: Persona[];
	threads: Thread[];
	selectedPersonaId?: string;
	onSelectPersona: (persona: Persona) => void;
	onNewPersona: () => void;
	onNewThread: (persona: Persona) => void;
};

export default function MobileMenu({ personas, threads, onSelectPersona, onNewPersona, onNewThread }: MobileMenuProps) {
	const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
	const router = useRouter();

	const handlePersonaSelect = (persona: Persona) => {
		setSelectedPersona(persona);
		onSelectPersona(persona);
	};

	const handleThreadSelect = (thread: Thread) => {
		router.push(`/app/thread/${thread.id}`);
	};

	return (
		<Popover.Root>
			<Popover.Trigger>
				<IconButton variant="outline" size="3">
					<IconMenu2 size={24} />
				</IconButton>
			</Popover.Trigger>
			<Popover.Content size="1" style={{ width: "90vw", maxWidth: "400px", maxHeight: "80vh" }}>
				<Flex direction="column" height="100%">
					<Flex p="2" justify="between" align="center" style={{ borderBottom: "1px solid var(--gray-6)" }}>
						<Text weight="bold" size="4">
							{selectedPersona?.name || "Personas"}
						</Text>
						{!selectedPersona ? (
							<IconButton variant="soft" onClick={onNewPersona}>
								<IconUserPlus size={16} />
							</IconButton>
						) : (
							<IconButton variant="soft" onClick={() => onNewThread(selectedPersona)}>
								<IconMessagePlus size={16} />
							</IconButton>
						)}
					</Flex>
					<Flex style={{ height: "60vh" }}>
						{/* Persona List - Always visible */}
						<Box style={{ width: selectedPersona ? "auto" : "100%" }}>
							<ScrollArea type="hover" scrollbars="vertical" style={{ height: "100%" }}>
								<Box p="2">
									<Flex direction="column" gap="3">
										{personas.map((persona) => (
											<Flex key={persona.id} onClick={() => handlePersonaSelect(persona)} style={{ cursor: "pointer" }}>
												<Flex align="center" gap="2" width="100%" direction={selectedPersona ? "column" : "row"}>
													<Avatar
														size={"3"}
														fallback={persona.name[0]}
														color="blue"
														radius="full"
														style={{
															outline: selectedPersona?.id === persona.id ? "2px solid var(--blue-10)" : "none",
															outlineOffset: "2px",
														}}
													/>
													{!selectedPersona && (
														<Flex direction="column">
															<Text weight="medium">{persona.name}</Text>
															<Text size="1" color="gray">
																Age: {persona.age} • {persona.experience.split(" ").slice(0, 3).join(" ")}...
															</Text>
														</Flex>
													)}
												</Flex>
											</Flex>
										))}

										<Box display={!selectedPersona ? "none" : "block"} mx={"auto"}>
											<IconButton variant="ghost" size="1" onClick={() => setSelectedPersona(null)}>
												<IconArrowBarRight size={16} />
											</IconButton>
										</Box>
									</Flex>
								</Box>
							</ScrollArea>
						</Box>

						{/* Thread List - Shows when persona is selected */}
						{selectedPersona && (
							<Box style={{ flex: 1 }}>
								<ScrollArea type="hover" scrollbars="vertical">
									<Box p="2">
										<Flex direction="column" gap="3">
											{threads
												.filter((thread) => thread.persona_id === selectedPersona.id)
												.map((thread) => (
													<Flex key={thread.id} onClick={() => handleThreadSelect(thread)}>
														<Flex direction="column" align="start" gap="1" width="100%">
															<Text weight="medium">{thread.title}</Text>
															<Text size="1" color="gray">
																{formatDistanceToNow(new Date(thread.created_at), {
																	addSuffix: true,
																})}
															</Text>
														</Flex>
													</Flex>
												))}
										</Flex>
									</Box>
								</ScrollArea>
							</Box>
						)}
					</Flex>
				</Flex>
			</Popover.Content>
		</Popover.Root>
	);
}
