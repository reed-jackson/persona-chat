import { Button, Dialog, Flex, Text, TextField, TextArea, CheckboxCards } from "@radix-ui/themes";
import { type Persona, type PersonaGroupWithMembers, createPersonaGroup, updatePersonaGroup } from "@/lib/supabase";
import { useState } from "react";

type GroupFormProps = {
	personas: Persona[];
	group?: PersonaGroupWithMembers;
	onSuccess: (group: PersonaGroupWithMembers) => void;
	onCancel: () => void;
};

export default function GroupForm({ personas, group, onSuccess, onCancel }: GroupFormProps) {
	const [name, setName] = useState(group?.name ?? "");
	const [description, setDescription] = useState(group?.description ?? "");
	const [selectedPersonaIds, setSelectedPersonaIds] = useState<string[]>(group?.members.map((m) => m.id) ?? []);
	const [error, setError] = useState<string>();
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!name.trim()) {
			setError("Group name is required");
			return;
		}

		if (selectedPersonaIds.length === 0) {
			setError("Please select at least one persona");
			return;
		}

		setError(undefined);
		setIsSubmitting(true);

		try {
			const result = group
				? await updatePersonaGroup(group.id, {
						name: name.trim(),
						description: description.trim() || null,
						personaIds: selectedPersonaIds,
				  })
				: await createPersonaGroup(name.trim(), description.trim() || null, selectedPersonaIds);

			onSuccess(result);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to save group");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<form onSubmit={handleSubmit}>
			<Dialog.Title>{group ? "Edit Group" : "Create Group"}</Dialog.Title>

			{error && (
				<Text color="red" size="2" mb="3">
					{error}
				</Text>
			)}

			<Flex direction="column" gap="3">
				<TextField.Root
					placeholder="Group Name"
					value={name}
					onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
				/>

				<TextArea
					placeholder="Description (optional)"
					value={description}
					onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
				/>

				<Text size="2" weight="medium" mb="-1">
					Select Personas
				</Text>

				<CheckboxCards.Root
					value={selectedPersonaIds}
					onValueChange={setSelectedPersonaIds}
					columns={{ initial: "1", sm: "2" }}
					gap="2"
				>
					{personas.map((persona) => (
						<CheckboxCards.Item key={persona.id} value={persona.id}>
							<Flex direction="column" width="100%">
								<Text weight="bold" size="2">
									{persona.name}
								</Text>
								<Text size="1" color="gray">
									Age: {persona.age} • {persona.experience.split(" ").slice(0, 3).join(" ")}...
								</Text>
							</Flex>
						</CheckboxCards.Item>
					))}
				</CheckboxCards.Root>

				<Flex gap="3" mt="4" justify="end">
					<Button variant="soft" color="gray" onClick={onCancel} type="button">
						Cancel
					</Button>
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting ? "Saving..." : group ? "Save Changes" : "Create Group"}
					</Button>
				</Flex>
			</Flex>
		</form>
	);
}
