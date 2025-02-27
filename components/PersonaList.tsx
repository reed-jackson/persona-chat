import { Avatar, Box, Button, Flex, ScrollArea, Text } from "@radix-ui/themes";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import { type Persona, type WorkplaceContext } from "@/lib/supabase";
import { deletePersona } from "@/lib/supabase";
import { useState } from "react";
import WorkplaceSettings from "./WorkplaceSettings";

type PersonaListProps = {
	personas: Persona[];
	onSelectPersona?: (persona: Persona) => void;
	onEditPersona?: (persona: Persona) => void;
	onDeletePersona?: (id: string) => void;
	onBulkMessage?: (personaIds: string[], message: string) => Promise<void>;
	selectedPersonaId?: string;
	workplaceContext?: WorkplaceContext;
	onWorkplaceContextSave?: (data: WorkplaceContext) => void;
};

export default function PersonaList({
	personas,
	onSelectPersona,
	onEditPersona,
	onDeletePersona,
	selectedPersonaId,
	workplaceContext,
	onWorkplaceContextSave,
}: PersonaListProps) {
	const [error, setError] = useState<string>();

	const handleDelete = async (id: string) => {
		if (!confirm("Are you sure you want to delete this persona?")) return;

		try {
			await deletePersona(id);
			onDeletePersona?.(id);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to delete persona");
		}
	};

	return (
		<Flex direction="column" className="h-full">
			{error && (
				<Box px="4" py="2">
					<Text color="red" size="2">
						{error}
					</Text>
				</Box>
			)}

			<ScrollArea type="hover" scrollbars="vertical" className="flex-1">
				<Box p="2">
					<Flex direction="column" gap="1">
						{personas.length === 0 ? (
							<Box p="2">
								<Text color="gray">No personas created yet</Text>
							</Box>
						) : (
							personas.map((persona) => (
								<Box
									key={persona.id}
									className={`cursor-pointer transition-colors rounded-lg`}
									style={{
										color: selectedPersonaId === persona.id ? "var(--blue-10)" : undefined,
									}}
									onClick={() => onSelectPersona?.(persona)}
								>
									<Flex gap="3" p="3" align="center">
										<Avatar size="4" fallback={persona.name[0]} color="blue" className="cursor-pointer" radius="full" />

										<Box className="flex-1 min-w-0">
											<Flex justify="between" align="center">
												<Text weight="medium" className="truncate">
													{persona.name}
												</Text>
												<Flex gap="1">
													<Button
														variant="ghost"
														size="1"
														onClick={(e) => {
															e.stopPropagation();
															onEditPersona?.(persona);
														}}
													>
														<IconEdit size={16} />
													</Button>
													<Button
														variant="ghost"
														color="red"
														size="1"
														onClick={(e) => {
															e.stopPropagation();
															handleDelete(persona.id);
														}}
													>
														<IconTrash size={16} />
													</Button>
												</Flex>
											</Flex>
											<Text size="2" color="gray" className="truncate">
												Age: {persona.age} • {persona.experience.split(" ").slice(0, 3).join(" ")}...
											</Text>
										</Box>
									</Flex>
								</Box>
							))
						)}
					</Flex>
				</Box>
			</ScrollArea>

			<Box p="2" py={"4"} style={{ borderTop: "1px solid var(--gray-6)" }} width="100%">
				<Flex direction="column" gap="2" px={"2"}>
					<WorkplaceSettings initialData={workplaceContext} onSave={onWorkplaceContextSave} />
				</Flex>
			</Box>
		</Flex>
	);
}
