"use client";

import { Button, Flex, Heading, TextArea, TextField, Tabs, Select, Text } from "@radix-ui/themes";
import { createPersona, updatePersona, type Persona } from "@/lib/supabase";
import { useState } from "react";
import { IconRefresh } from "@tabler/icons-react";
import { toast } from "sonner";

const INDUSTRY_OPTIONS = [
	"SaaS",
	"E-commerce",
	"Gaming",
	"Healthcare",
	"Education",
	"Finance",
	"Manufacturing",
	"Real Estate",
	"Media & Entertainment",
	"Technology",
	"Other",
] as const;

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
		title: persona?.title || "",
		age: persona?.age?.toString() || "",
		industry: persona?.industry || "Technology",
		experience: persona?.experience || "",
		pain_points: persona?.pain_points || "",
		values: persona?.values || "",
		system_prompt: persona?.system_prompt || "",
	});

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSelectChange = (name: string, value: string) => {
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const generateSystemPrompt = async () => {
		setIsGenerating(true);
		setError(undefined);

		try {
			const response = await fetch("/api/generate/persona-prompt", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: formData.name,
					title: formData.title,
					age: parseInt(formData.age),
					industry: formData.industry,
					experience: formData.experience,
					pain_points: formData.pain_points,
					values: formData.values,
				}),
			});

			if (!response.ok) throw new Error("Failed to generate prompt");

			const { system_prompt } = await response.json();
			setFormData((prev) => ({ ...prev, system_prompt }));
			toast.success("Generated system prompt");

			return system_prompt;
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to generate prompt";
			toast.error(message);
			setError(message);
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
				title: formData.title,
				age: parseInt(formData.age),
				industry: formData.industry,
				experience: formData.experience,
				pain_points: formData.pain_points,
				values: formData.values,
				system_prompt: prompt,
				is_deleted: false,
			};

			const result = persona?.id ? await updatePersona(persona.id, personaData) : await createPersona(personaData);
			toast.success(persona?.id ? "Updated persona successfully" : "Created new persona successfully");
			onSuccess?.(result);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to save persona";
			toast.error(message);
			setError(message);
		} finally {
			setIsSubmitting(false);
		}
	};

	const isInfoComplete = () => {
		return (
			formData.name &&
			formData.title &&
			formData.age &&
			formData.industry &&
			formData.experience &&
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
							{/* Basic Information */}
							<Flex gap="4">
								<div className="flex-1">
									<Text as="label" size="2" className="font-medium mb-1.5 block">
										Name
									</Text>
									<TextField.Root
										value={formData.name}
										onChange={handleInputChange}
										name="name"
										id="name"
										required
									></TextField.Root>
								</div>
								<div className="flex-1">
									<Text as="label" size="2" className="font-medium mb-1.5 block">
										Title
									</Text>
									<TextField.Root
										value={formData.title}
										onChange={handleInputChange}
										name="title"
										id="title"
										placeholder="Product Manager"
										required
									></TextField.Root>
								</div>
							</Flex>

							<Flex gap="4">
								<div className="flex-1">
									<Text as="label" size="2" className="font-medium mb-1.5 block">
										Age
									</Text>
									<TextField.Root
										value={formData.age}
										onChange={handleInputChange}
										name="age"
										id="age"
										type="number"
										required
									></TextField.Root>
								</div>
								<div className="flex-1">
									<Text as="label" size="2" className="font-medium mb-1.5 block">
										Industry
									</Text>
									<Select.Root
										name="industry"
										value={formData.industry}
										onValueChange={(value) => handleSelectChange("industry", value)}
									>
										<Select.Trigger />
										<Select.Content>
											{INDUSTRY_OPTIONS.map((industry) => (
												<Select.Item key={industry} value={industry}>
													{industry}
												</Select.Item>
											))}
										</Select.Content>
									</Select.Root>
								</div>
							</Flex>

							{/* Professional Context */}
							<div>
								<Text as="label" size="2" className="font-medium mb-1.5 block">
									Professional Experience
								</Text>
								<TextArea
									id="experience"
									name="experience"
									placeholder="Describe their role, responsibilities, and years of experience..."
									value={formData.experience}
									onChange={handleInputChange}
									required
								/>
							</div>

							{/* Needs and Motivations */}
							<div>
								<Text as="label" size="2" className="font-medium mb-1.5 block">
									Pain Points & Challenges
								</Text>
								<TextArea
									id="pain_points"
									name="pain_points"
									placeholder="What are their main frustrations, challenges, and unmet needs in their role?"
									value={formData.pain_points}
									onChange={handleInputChange}
									rows={4}
									required
								/>
							</div>

							<div>
								<Text as="label" size="2" className="font-medium mb-1.5 block">
									Values & Priorities
								</Text>
								<TextArea
									id="values"
									name="values"
									placeholder="What do they value most in products/solutions? What are their key priorities and goals?"
									value={formData.values}
									onChange={handleInputChange}
									rows={4}
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
					<form>
						<Flex direction="column" gap="4" mt={"4"}>
							<Flex justify="between" align="center">
								<Button
									type="button"
									variant="soft"
									onClick={generateSystemPrompt}
									disabled={isGenerating || !isInfoComplete()}
								>
									<IconRefresh size={16} className={isGenerating ? "animate-spin" : ""} />
									{isGenerating ? "Generating..." : "Generate"}
								</Button>
							</Flex>
							<div>
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
							<Button type="button" disabled={isSubmitting}>
								{isSubmitting ? "Saving..." : "Save Prompt"}
							</Button>
						</Flex>
					</form>
				</Tabs.Content>
			</Tabs.Root>
		</div>
	);
}
