import { Avatar, Flex, Text } from "@radix-ui/themes";
import { type Message, type Persona } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";

type MessageBubbleProps = {
	message: Message;
	isUser: boolean;
	persona?: Persona;
	showAvatar?: boolean;
};

export default function MessageBubble({ message, isUser, persona, showAvatar }: MessageBubbleProps) {
	return (
		<Flex gap="2" align="end" justify={isUser ? "end" : "start"}>
			{!isUser && showAvatar && (
				<Avatar size="2" fallback={persona?.name?.[0] ?? message.sender[0]} color="blue" radius="full" className="mb-1" />
			)}
			<Flex
				direction="column"
				style={{
					borderRadius: "var(--radius-4)",
					backgroundColor: isUser ? "var(--blue-9)" : "var(--gray-3)",
					padding: "var(--space-2) var(--space-3)",
					maxWidth: "75%",
				}}
			>
				{!isUser && (
					<Text size="1" weight="medium" mb="1">
						{persona?.name ?? message.sender}
					</Text>
				)}
				<Text>{message.content}</Text>
				<Text size="1" color={isUser ? "gray" : "gray"} mt="1">
					{formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
				</Text>
			</Flex>
			{isUser && showAvatar && <Avatar size="2" fallback="U" color="blue" radius="full" className="mb-1" />}
		</Flex>
	);
}
