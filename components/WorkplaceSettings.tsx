import { useState } from "react";
import { IconSettings } from "@tabler/icons-react";
import { type Database } from "@/types/supabase";
import { saveWorkplaceContext } from "@/lib/supabase";
import { Button, TextField, Select, Text, Dialog, TextArea } from "@radix-ui/themes";
import { Flex, Box } from "@radix-ui/themes";

type WorkplaceContext = Database["public"]["Tables"]["workplace_context"]["Row"];
type WorkplaceContextInput = Omit<WorkplaceContext, "id" | "user_id" | "created_at" | "updated_at">;

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
	"Other",
] as const;

interface WorkplaceSettingsProps {
	initialData?: WorkplaceContext;
	onSave?: (data: WorkplaceContext) => void;
}

export default function WorkplaceSettings({ initialData, onSave }: WorkplaceSettingsProps) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setLoading(true);

		try {
			const formData = new FormData(event.currentTarget);
			const data: WorkplaceContextInput = {
				company_name: formData.get("company_name") as string,
				product_name: formData.get("product_name") as string,
				description: formData.get("description") as string,
				industry: formData.get("industry") as string,
				target_audience: formData.get("target_audience") as string,
			};

			const result = await saveWorkplaceContext(data);
			onSave?.(result);
			setOpen(false);
		} catch (error) {
			console.error("Error saving workplace context:", error);
		} finally {
			setLoading(false);
		}
	}

	return (
		<Dialog.Root open={open} onOpenChange={setOpen}>
			<Dialog.Trigger>
				<Button variant="ghost" size="2">
					<IconSettings width="16" height="16" />
					Settings
				</Button>
			</Dialog.Trigger>
			<Dialog.Content>
				<Dialog.Title>Workplace Settings</Dialog.Title>
				<form onSubmit={handleSubmit}>
					<Flex direction="column" gap="3">
						<Box>
							<Text as="label" size="2" mb="1" weight="medium">
								Company Name
							</Text>
							<TextField.Root name="company_name" defaultValue={initialData?.company_name} placeholder="Acme Corp" required />
						</Box>

						<Box>
							<Text as="label" size="2" mb="1" weight="medium">
								Product/Service Name
							</Text>
							<TextField.Root name="product_name" defaultValue={initialData?.product_name} placeholder="GrowthHub" required />
						</Box>

						<Box>
							<Text as="label" size="2" mb="1" weight="medium">
								Description
							</Text>
							<TextArea
								name="description"
								defaultValue={initialData?.description}
								placeholder="A SaaS tool for product growth teams..."
								required
								size="3"
							/>
						</Box>

						<Box>
							<Text as="label" size="2" mb="1" weight="medium">
								Industry
							</Text>
							<Select.Root name="industry" defaultValue={initialData?.industry || "SaaS"}>
								<Select.Trigger />
								<Select.Content>
									{INDUSTRY_OPTIONS.map((industry) => (
										<Select.Item key={industry} value={industry}>
											{industry}
										</Select.Item>
									))}
								</Select.Content>
							</Select.Root>
						</Box>

						<Box>
							<Text as="label" size="2" mb="1" weight="medium">
								Target Audience
							</Text>
							<TextArea
								name="target_audience"
								defaultValue={initialData?.target_audience}
								placeholder="Product managers and growth marketers"
								required
								size="3"
							/>
						</Box>
					</Flex>

					<Flex gap="3" mt="4" justify="end">
						<Dialog.Close>
							<Button variant="soft" color="gray">
								Cancel
							</Button>
						</Dialog.Close>
						<Button type="submit" disabled={loading}>
							{loading ? "Saving..." : "Save"}
						</Button>
					</Flex>
				</form>
			</Dialog.Content>
		</Dialog.Root>
	);
}
