import { Avatar, Box, DropdownMenu, Flex, IconButton, ScrollArea, Text, Tooltip } from "@radix-ui/themes";
import { IconEdit, IconTrash, IconDotsVertical } from "@tabler/icons-react";
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

			<ScrollArea type="hover" scrollbars="vertical">
				<Flex direction="column" align={{ initial: "center", md: "stretch" }} gap="1" p="2">
					{personas.length === 0 ? (
						<Box p="2">
							<Text color="gray">No personas created yet</Text>
						</Box>
					) : (
						personas.map((persona) => (
							<Tooltip key={persona.id} content={persona.name} side="right">
								<Box
									className={`cursor-pointer transition-colors rounded-lg`}
									style={{
										color: selectedPersonaId === persona.id ? "var(--blue-10)" : undefined,
									}}
									onClick={() => onSelectPersona?.(persona)}
								>
									<Flex gap="3" p="3" align="center">
										<Avatar size="3" fallback={persona.name[0]} color="blue" className="cursor-pointer" radius="full" />

										<Box className="flex-1 min-w-0" display={{ initial: "none", md: "block" }}>
											<Flex justify="between" align="center">
												<Text weight="medium" className="truncate">
													{persona.name}
												</Text>
												<Flex gap="2">
													<DropdownMenu.Root>
														<DropdownMenu.Trigger>
															<IconButton variant="ghost" size="1">
																<IconDotsVertical size={16} />
															</IconButton>
														</DropdownMenu.Trigger>

														<DropdownMenu.Content align="end" className="min-w-[140px]">
															<DropdownMenu.Item
																className="flex items-center gap-2 cursor-pointer"
																onClick={(e) => {
																	e.stopPropagation();
																	onEditPersona?.(persona);
																}}
															>
																<IconEdit size={16} />
																Edit
															</DropdownMenu.Item>

															<DropdownMenu.Item
																className="flex items-center gap-2 cursor-pointer text-red-500"
																onClick={(e) => {
																	e.stopPropagation();
																	handleDelete(persona.id);
																}}
															>
																<IconTrash size={16} />
																Delete
															</DropdownMenu.Item>
														</DropdownMenu.Content>
													</DropdownMenu.Root>
												</Flex>
											</Flex>
											<Text size="2" color="gray" className="truncate">
												{persona.title}
											</Text>
										</Box>
									</Flex>
								</Box>
							</Tooltip>
						))
					)}
				</Flex>
			</ScrollArea>

			<Box p="2" py={"4"} style={{ borderTop: "1px solid var(--gray-6)" }} width="100%">
				<Flex direction="column" gap="2" px={"2"}>
					<WorkplaceSettings initialData={workplaceContext} onSave={onWorkplaceContextSave} />
				</Flex>
			</Box>
		</Flex>
	);
}
