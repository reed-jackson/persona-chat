import { Flex, Text } from "@radix-ui/themes";
import { type Message } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import Markdown from "react-markdown";

type MessageBubbleProps = {
	message: Message;
	isUser: boolean;
};

export default function MessageBubble({ message, isUser }: MessageBubbleProps) {
	return (
		<Flex direction="column" width={"100%"} align={isUser ? "end" : "start"} className={`mb-2`}>
			<Flex
				style={{
					backgroundColor: isUser ? "var(--blue-10)" : "var(--gray-4)",
					color: isUser ? "white" : "var(--gray-12)",
					borderRadius: "var(--radius-4)",
				}}
				maxWidth={"80%"}
				px="3"
			>
				<Text size="2" my={"-1"}>
					<Markdown>{message.content}</Markdown>
				</Text>
			</Flex>
			<Text size="1" color="gray" mt={"1"} mx={"2"}>
				{formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
			</Text>
		</Flex>
	);
}
