import { Avatar, Box, DropdownMenu, Flex, IconButton, ScrollArea, Text, Tooltip, Dialog, Tabs } from "@radix-ui/themes";
import { IconEdit, IconTrash, IconDotsVertical, IconUsers, IconUsersPlus } from "@tabler/icons-react";
import {
	type Persona,
	type WorkplaceContext,
	type PersonaGroupWithMembers,
	deletePersona,
	deletePersonaGroup,
} from "@/lib/supabase";
import { useState } from "react";
import WorkplaceSettings from "./WorkplaceSettings";
import GroupForm from "./GroupForm";

type PersonaListProps = {
	personas: Persona[];
	groups: PersonaGroupWithMembers[];
	onSelectPersona?: (persona: Persona) => void;
	onSelectGroup?: (group: PersonaGroupWithMembers) => void;
	onEditPersona?: (persona: Persona) => void;
	onDeletePersona?: (id: string) => void;
	onGroupCreate?: (group: PersonaGroupWithMembers) => void;
	onGroupUpdate?: (group: PersonaGroupWithMembers) => void;
	onGroupDelete?: (id: string) => void;
	onBulkMessage?: (personaIds: string[], message: string) => Promise<void>;
	selectedPersonaId?: string;
	selectedGroupId?: string;
	workplaceContext?: WorkplaceContext;
	onWorkplaceContextSave?: (data: WorkplaceContext) => void;
};

export default function PersonaList({
	personas,
	groups,
	onSelectPersona,
	onSelectGroup,
	onEditPersona,
	onDeletePersona,
	onGroupCreate,
	onGroupUpdate,
	onGroupDelete,
	selectedPersonaId,
	selectedGroupId,
	workplaceContext,
	onWorkplaceContextSave,
}: PersonaListProps) {
	const [error, setError] = useState<string>();
	const [isNewGroupOpen, setIsNewGroupOpen] = useState(false);
	const [editingGroup, setEditingGroup] = useState<PersonaGroupWithMembers>();

	const handleDelete = async (id: string) => {
		if (!confirm("Are you sure you want to delete this persona?")) return;

		try {
			await deletePersona(id);
			onDeletePersona?.(id);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to delete persona");
		}
	};

	const handleGroupDelete = async (id: string) => {
		if (!confirm("Are you sure you want to delete this group?")) return;

		try {
			await deletePersonaGroup(id);
			onGroupDelete?.(id);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to delete group");
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
					<Tabs.Root defaultValue="personas">
						<Tabs.List>
							<Tabs.Trigger value="personas">Personas</Tabs.Trigger>
							<Tabs.Trigger value="groups">Groups</Tabs.Trigger>
						</Tabs.List>

						<Box mt="2">
							<Tabs.Content value="personas">
								<Flex direction="column" align={{ initial: "center", md: "stretch" }} gap="1">
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
														<Avatar size="4" fallback={persona.name[0]} color="blue" className="cursor-pointer" radius="full" />

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
																{persona.experience.split(" ").slice(0, 3).join(" ")}...
															</Text>
														</Box>
													</Flex>
												</Box>
											</Tooltip>
										))
									)}
								</Flex>
							</Tabs.Content>

							<Tabs.Content value="groups">
								<Flex direction="column" gap="2">
									<Flex justify="end">
										<IconButton variant="soft" size="2" onClick={() => setIsNewGroupOpen(true)}>
											<IconUsersPlus size={16} />
										</IconButton>
									</Flex>

									{groups.length === 0 ? (
										<Box p="2">
											<Text color="gray">No groups created yet</Text>
										</Box>
									) : (
										groups.map((group) => (
											<Box
												key={group.id}
												className={`cursor-pointer transition-colors rounded-lg`}
												style={{
													color: selectedGroupId === group.id ? "var(--blue-10)" : undefined,
												}}
												onClick={() => onSelectGroup?.(group)}
											>
												<Flex gap="3" p="3" align="start">
													<IconUsers size={24} className="flex-shrink-0" />

													<Box className="flex-1 min-w-0">
														<Flex justify="between" align="center">
															<Text weight="medium" className="truncate">
																{group.name}
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
																				setEditingGroup(group);
																			}}
																		>
																			<IconEdit size={16} />
																			Edit
																		</DropdownMenu.Item>

																		<DropdownMenu.Item
																			className="flex items-center gap-2 cursor-pointer text-red-500"
																			onClick={(e) => {
																				e.stopPropagation();
																				handleGroupDelete(group.id);
																			}}
																		>
																			<IconTrash size={16} />
																			Delete
																		</DropdownMenu.Item>
																	</DropdownMenu.Content>
																</DropdownMenu.Root>
															</Flex>
														</Flex>
														{group.description && (
															<Text size="2" color="gray" className="truncate">
																{group.description}
															</Text>
														)}
														<Flex gap="1" mt="1" className="flex-wrap">
															{group.members.map((member) => (
																<Avatar key={member.id} size="1" fallback={member.name[0]} color="blue" radius="full" />
															))}
														</Flex>
													</Box>
												</Flex>
											</Box>
										))
									)}
								</Flex>
							</Tabs.Content>
						</Box>
					</Tabs.Root>
				</Box>
			</ScrollArea>

			<Box p="2" py={"4"} style={{ borderTop: "1px solid var(--gray-6)" }} width="100%">
				<Flex direction="column" gap="2" px={"2"}>
					<WorkplaceSettings initialData={workplaceContext} onSave={onWorkplaceContextSave} />
				</Flex>
			</Box>

			{/* Group Form Dialog */}
			<Dialog.Root
				open={isNewGroupOpen || !!editingGroup}
				onOpenChange={(open) => {
					if (!open) {
						setIsNewGroupOpen(false);
						setEditingGroup(undefined);
					}
				}}
			>
				<Dialog.Content>
					<GroupForm
						personas={personas}
						group={editingGroup}
						onSuccess={(group) => {
							if (editingGroup) {
								onGroupUpdate?.(group);
								setEditingGroup(undefined);
							} else {
								onGroupCreate?.(group);
								setIsNewGroupOpen(false);
							}
						}}
						onCancel={() => {
							setIsNewGroupOpen(false);
							setEditingGroup(undefined);
						}}
					/>
				</Dialog.Content>
			</Dialog.Root>
		</Flex>
	);
}
