import { Button, Flex, Heading, TextArea, TextField, Tabs } from "@radix-ui/themes";
import { createPersona, updatePersona, type Persona } from "@/lib/supabase";
import { useState } from "react";
import { IconRefresh } from "@tabler/icons-react";

type PersonaFormProps = {
	persona?: Partial<Persona>;
	onSuccess?: (persona: Persona) => void;
	onCancel?: () => void;
};

export default function PersonaForm({ persona, onSuccess, onCancel }: PersonaFormProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);
	const [error, setError] = useState<string>();
	const [activeTab, setActiveTab] = useState("info");
	const [formData, setFormData] = useState({
		name: persona?.name || "",
		age: persona?.age?.toString() || "",
		experience: persona?.experience || "",
		personality: persona?.personality || "",
		pain_points: persona?.pain_points || "",
		values: persona?.values || "",
		system_prompt: persona?.system_prompt || "",
	});

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const generateSystemPrompt = async () => {
		setIsGenerating(true);
		setError(undefined);

		try {
			const response = await fetch("/api/generate-prompt", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: formData.name,
					age: parseInt(formData.age),
					experience: formData.experience,
					personality: formData.personality,
					pain_points: formData.pain_points,
					values: formData.values,
				}),
			});

			if (!response.ok) throw new Error("Failed to generate prompt");

			const { prompt } = await response.json();
			setFormData((prev) => ({ ...prev, system_prompt: prompt }));

			// If we have a persona ID, save the new prompt immediately
			if (persona?.id) {
				await updatePersona(persona.id, { system_prompt: prompt });
			}

			return prompt;
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to generate prompt");
			throw err;
		} finally {
			setIsGenerating(false);
		}
	};

	const handleInfoSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsSubmitting(true);
		setError(undefined);

		try {
			// First generate a new system prompt
			const prompt = await generateSystemPrompt();

			// Then save all persona data
			const personaData = {
				name: formData.name,
				age: parseInt(formData.age),
				experience: formData.experience,
				personality: formData.personality,
				pain_points: formData.pain_points,
				values: formData.values,
				system_prompt: prompt,
				is_deleted: false,
			};

			const result = persona?.id ? await updatePersona(persona.id, personaData) : await createPersona(personaData);
			onSuccess?.(result);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to save persona");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handlePromptSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsSubmitting(true);
		setError(undefined);

		try {
			if (!persona?.id) throw new Error("No persona ID found");

			await updatePersona(persona.id, { system_prompt: formData.system_prompt });
			onSuccess?.(await updatePersona(persona.id, { system_prompt: formData.system_prompt }));
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to save prompt");
		} finally {
			setIsSubmitting(false);
		}
	};

	const isInfoComplete = () => {
		return (
			formData.name &&
			formData.age &&
			formData.experience &&
			formData.personality &&
			formData.pain_points &&
			formData.values
		);
	};

	return (
		<div className="space-y-6">
			<Heading size="4">{persona?.id ? "Edit Persona" : "Create New Persona"}</Heading>

			<Tabs.Root value={activeTab} onValueChange={setActiveTab}>
				<Tabs.List>
					<Tabs.Trigger value="info">Info</Tabs.Trigger>
					<Tabs.Trigger value="prompt" disabled={!isInfoComplete()}>
						System Prompt
					</Tabs.Trigger>
				</Tabs.List>

				<Tabs.Content value="info" style={{ padding: "8px" }}>
					<form onSubmit={handleInfoSubmit} className="mt-4">
						<Flex direction="column" gap="4">
							<div>
								<label htmlFor="name" className="text-sm font-medium mb-1.5 block">
									Name
								</label>
								<TextField.Root
									value={formData.name}
									onChange={handleInputChange}
									name="name"
									id="name"
									required
								></TextField.Root>
							</div>

							<div>
								<label htmlFor="age" className="text-sm font-medium mb-1.5 block">
									Age
								</label>
								<TextField.Root
									value={formData.age}
									onChange={handleInputChange}
									name="age"
									id="age"
									type="number"
									required
								></TextField.Root>
							</div>

							<div>
								<label htmlFor="experience" className="text-sm font-medium mb-1.5 block">
									Professional Experience
								</label>
								<TextArea
									id="experience"
									name="experience"
									placeholder="Describe their background and experience..."
									value={formData.experience}
									onChange={handleInputChange}
									required
								/>
							</div>

							<div>
								<label htmlFor="personality" className="text-sm font-medium mb-1.5 block">
									Personality Traits
								</label>
								<TextArea
									id="personality"
									name="personality"
									placeholder="Describe their personality traits..."
									value={formData.personality}
									onChange={handleInputChange}
									required
								/>
							</div>

							<div>
								<label htmlFor="pain_points" className="text-sm font-medium mb-1.5 block">
									Pain Points
								</label>
								<TextArea
									id="pain_points"
									name="pain_points"
									placeholder="What challenges do they face?"
									value={formData.pain_points}
									onChange={handleInputChange}
									required
								/>
							</div>

							<div>
								<label htmlFor="values" className="text-sm font-medium mb-1.5 block">
									Values & Priorities
								</label>
								<TextArea
									id="values"
									name="values"
									placeholder="What do they value most?"
									value={formData.values}
									onChange={handleInputChange}
									required
								/>
							</div>
						</Flex>

						{error && <div className="text-red-500 text-sm mt-4">{error}</div>}

						<Flex gap="3" justify="end" mt={"3"}>
							{onCancel && (
								<Button type="button" variant="soft" onClick={onCancel} disabled={isSubmitting}>
									Cancel
								</Button>
							)}
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting ? "Saving..." : persona?.id ? "Save Changes" : "Create Persona"}
							</Button>
						</Flex>
					</form>
				</Tabs.Content>

				<Tabs.Content value="prompt">
					<form onSubmit={handlePromptSubmit} className="mt-4">
						<Flex direction="column" gap="4">
							<Flex justify="between" align="center">
								<Heading size="2">System Prompt</Heading>
								<Button
									type="button"
									variant="soft"
									onClick={generateSystemPrompt}
									disabled={isGenerating || !isInfoComplete()}
								>
									<IconRefresh className={isGenerating ? "animate-spin" : ""} />
									{isGenerating ? "Generating..." : "Generate"}
								</Button>
							</Flex>
							<div>
								<label htmlFor="system_prompt" className="text-sm font-medium mb-1.5 block">
									AI Behavior Instructions
								</label>
								<TextArea
									id="system_prompt"
									name="system_prompt"
									placeholder="Generate a system prompt or write your own..."
									value={formData.system_prompt}
									onChange={handleInputChange}
									required
									rows={10}
								/>
							</div>
						</Flex>

						{error && <div className="text-red-500 text-sm mt-4">{error}</div>}

						<Flex gap="3" justify="end" className="mt-6">
							{onCancel && (
								<Button type="button" variant="soft" onClick={onCancel} disabled={isSubmitting}>
									Cancel
								</Button>
							)}
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting ? "Saving..." : "Save Prompt"}
							</Button>
						</Flex>
					</form>
				</Tabs.Content>
			</Tabs.Root>
		</div>
	);
}
