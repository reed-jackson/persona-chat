import { Button, Dialog, Flex, Text, TextArea } from "@radix-ui/themes";
import { type Persona } from "@/lib/supabase";
import { useState } from "react";
import { IconSend } from "@tabler/icons-react";

type BulkMessageProps = {
	personas: Persona[];
	onSendMessages: (selectedPersonaIds: string[], message: string) => Promise<void>;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export default function BulkMessage({ personas, onSendMessages, open, onOpenChange }: BulkMessageProps) {
	const [selectedPersonaIds, setSelectedPersonaIds] = useState<string[]>([]);
	const [message, setMessage] = useState("");
	const [isSending, setIsSending] = useState(false);
	const [error, setError] = useState<string>();

	const handleSend = async () => {
		if (selectedPersonaIds.length === 0) {
			setError("Please select at least one persona");
			return;
		}

		if (!message.trim()) {
			setError("Please enter a message");
			return;
		}

		setError(undefined);
		setIsSending(true);

		try {
			await onSendMessages(selectedPersonaIds, message);
			setMessage("");
			setSelectedPersonaIds([]);
			onOpenChange(false);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to send messages");
		} finally {
			setIsSending(false);
		}
	};

	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<Dialog.Content style={{ maxWidth: 600 }}>
				<Dialog.Title>Bulk Message</Dialog.Title>
				<Dialog.Description size="2" mb="4">
					Send a message to multiple personas at once
				</Dialog.Description>

				{error && (
					<Text color="red" size="2" mb="3">
						{error}
					</Text>
				)}

				<Flex direction="column" gap="3">
					<div className="border rounded-lg p-2 max-h-48 overflow-y-auto">
						{personas.map((persona) => (
							<label key={persona.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
								<input
									type="checkbox"
									checked={selectedPersonaIds.includes(persona.id)}
									onChange={(e) => {
										if (e.target.checked) {
											setSelectedPersonaIds([...selectedPersonaIds, persona.id]);
										} else {
											setSelectedPersonaIds(selectedPersonaIds.filter((id) => id !== persona.id));
										}
									}}
									className="h-4 w-4"
								/>
								<Text>{persona.name}</Text>
							</label>
						))}
					</div>

					<TextArea
						placeholder="Type your message..."
						value={message}
						onChange={(e) => setMessage(e.target.value)}
						rows={4}
					/>

					<Flex gap="3" mt="4" justify="end">
						<Dialog.Close>
							<Button variant="soft" color="gray">
								Cancel
							</Button>
						</Dialog.Close>
						<Button onClick={handleSend} disabled={isSending}>
							<IconSend size={16} />
							{isSending ? "Sending..." : "Send"}
						</Button>
					</Flex>
				</Flex>
			</Dialog.Content>
		</Dialog.Root>
	);
}
