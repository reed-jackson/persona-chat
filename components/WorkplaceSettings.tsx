import { useState } from "react";
import { IconSettings } from "@tabler/icons-react";
import { type Database } from "@/types/supabase";
import { saveWorkplaceContext, updateUserEmail, updateUserPassword, logout } from "@/lib/supabase";
import { Button, TextField, Select, Text, Dialog, TextArea, Tabs } from "@radix-ui/themes";
import { Flex, Box } from "@radix-ui/themes";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useTheme } from "next-themes";

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
	const [currentEmail, setCurrentEmail] = useState<string>("");
	const [error, setError] = useState<string>("");
	const router = useRouter();
	const { theme, setTheme } = useTheme();

	// Fetch current user's email when dialog opens
	const fetchUserEmail = async () => {
		const supabase = createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (user?.email) {
			setCurrentEmail(user.email);
		}
	};

	async function handleWorkplaceSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setLoading(true);
		setError("");

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
			setError("Failed to save workplace settings");
		} finally {
			setLoading(false);
		}
	}

	async function handleProfileSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setLoading(true);
		setError("");

		try {
			const formData = new FormData(event.currentTarget);
			const email = formData.get("email") as string;
			const newPassword = formData.get("new_password") as string;
			const confirmPassword = formData.get("confirm_password") as string;

			if (email !== currentEmail) {
				await updateUserEmail(email);
			}

			if (newPassword) {
				if (newPassword !== confirmPassword) {
					throw new Error("Passwords don't match");
				}
				if (newPassword.length < 6) {
					throw new Error("Password must be at least 6 characters");
				}
				await updateUserPassword(newPassword);
			}

			setOpen(false);
		} catch (error) {
			console.error("Error updating profile:", error);
			setError(error instanceof Error ? error.message : "Failed to update profile");
		} finally {
			setLoading(false);
		}
	}

	async function handleLogout() {
		setLoading(true);
		try {
			await logout();
			router.push("/login");
		} catch (error) {
			console.error("Error logging out:", error);
			setError("Failed to log out");
		} finally {
			setLoading(false);
		}
	}

	return (
		<Dialog.Root
			open={open}
			onOpenChange={(isOpen) => {
				setOpen(isOpen);
				if (isOpen) {
					fetchUserEmail();
				}
				setError("");
			}}
		>
			<Dialog.Trigger>
				<Button variant="ghost" size="2">
					<IconSettings width="16" height="16" />
					Settings
				</Button>
			</Dialog.Trigger>
			<Dialog.Content>
				<Dialog.Title>Settings</Dialog.Title>
				<Tabs.Root defaultValue="workplace">
					<Tabs.List>
						<Tabs.Trigger value="workplace">Workplace Context</Tabs.Trigger>
						<Tabs.Trigger value="profile">Profile</Tabs.Trigger>
						<Tabs.Trigger value="appearance">Appearance</Tabs.Trigger>
					</Tabs.List>

					<Box mt="4">
						{error && (
							<Text color="red" size="2" mb="3">
								{error}
							</Text>
						)}

						<Tabs.Content value="workplace">
							<form onSubmit={handleWorkplaceSubmit}>
								<Flex direction="column" gap="3">
									<Box>
										<Text as="label" size="2" mb="1" weight="medium">
											Company Name
										</Text>
										<TextField.Root
											name="company_name"
											defaultValue={initialData?.company_name || ""}
											placeholder="Acme Corp"
											required
										/>
									</Box>

									<Box>
										<Text as="label" size="2" mb="1" weight="medium">
											Product/Service Name
										</Text>
										<TextField.Root
											name="product_name"
											defaultValue={initialData?.product_name || ""}
											placeholder="GrowthHub"
											required
										/>
									</Box>

									<Box>
										<Text as="label" size="2" mb="1" weight="medium">
											Description
										</Text>
										<TextArea
											name="description"
											defaultValue={initialData?.description || ""}
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
											defaultValue={initialData?.target_audience || ""}
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
						</Tabs.Content>

						<Tabs.Content value="profile">
							<form onSubmit={handleProfileSubmit}>
								<Flex direction="column" gap="3">
									<Box>
										<Text as="label" size="2" mb="1" weight="medium">
											Email
										</Text>
										<TextField.Root name="email" defaultValue={currentEmail} placeholder="your@email.com" required type="email" />
									</Box>

									<Box>
										<Text as="label" size="2" mb="1" weight="medium">
											New Password
										</Text>
										<TextField.Root name="new_password" type="password" placeholder="Leave blank to keep current" />
									</Box>

									<Box>
										<Text as="label" size="2" mb="1" weight="medium">
											Confirm New Password
										</Text>
										<TextField.Root name="confirm_password" type="password" placeholder="Leave blank to keep current" />
									</Box>
								</Flex>

								<Flex gap="3" mt="4" justify="between">
									<Flex gap="3">
										<Dialog.Close>
											<Button variant="soft" color="gray">
												Cancel
											</Button>
										</Dialog.Close>
										<Button type="submit" disabled={loading}>
											{loading ? "Saving..." : "Save"}
										</Button>
									</Flex>
								</Flex>
							</form>

							<Button mt={"6"} type="button" variant="ghost" color="red" onClick={handleLogout} disabled={loading}>
								{loading ? "Logging out..." : "Log out"}
							</Button>
						</Tabs.Content>

						<Tabs.Content value="appearance">
							<Flex direction="column" gap="3">
								<Box>
									<Text as="label" size="2" mb="1" weight="medium">
										Theme
									</Text>
									<Select.Root value={theme} onValueChange={setTheme}>
										<Select.Trigger />
										<Select.Content>
											<Select.Item value="system">System</Select.Item>
											<Select.Item value="light">Light</Select.Item>
											<Select.Item value="dark">Dark</Select.Item>
										</Select.Content>
									</Select.Root>
								</Box>
							</Flex>
						</Tabs.Content>
					</Box>
				</Tabs.Root>
			</Dialog.Content>
		</Dialog.Root>
	);
}
