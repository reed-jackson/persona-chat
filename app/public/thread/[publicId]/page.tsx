import { Avatar, Box, Container, Flex, ScrollArea, Text, Card, Badge } from "@radix-ui/themes";
import { notFound } from "next/navigation";
import MessageBubble from "@/components/MessageBubble";
import { createClient } from "@/utils/supabase/server";
import { type Message } from "@/lib/supabase";

export default async function PublicThreadPage({ params }: { params: Promise<{ publicId: string }> }) {
	const { publicId } = await params;
	const supabase = await createClient();

	// Fetch public thread
	const { data: publicThread, error: threadError } = await supabase
		.from("public_threads")
		.select("*")
		.eq("id", publicId)
		.single();

	if (threadError || !publicThread) {
		notFound();
	}

	return (
		<Container size="2" p="4">
			<Card size="3" className="mb-6">
				<Flex gap="4" align="start">
					<Avatar size="6" fallback={publicThread.persona_details.name[0]} radius="full" />
					<Box className="flex-grow">
						<Flex justify="between" align="center" mb="2">
							<Box>
								<Text size="6" weight="bold">
									{publicThread.persona_details.name}
								</Text>
								<Text size="2" color="gray">
									{publicThread.title}
								</Text>
							</Box>
							<Badge size="2">Age: {publicThread.persona_details.age}</Badge>
						</Flex>

						<Box my="4">
							<Flex direction="column" gap="3">
								<Box>
									<Text as="div" size="2" weight="bold" color="gray" mb="1">
										Experience
									</Text>
									<Text as="div" size="2">
										{publicThread.persona_details.experience}
									</Text>
								</Box>

								<Box>
									<Text as="div" size="2" weight="bold" color="gray" mb="1">
										Personality
									</Text>
									<Text as="div" size="2">
										{publicThread.persona_details.personality}
									</Text>
								</Box>

								<Flex gap="4">
									<Box className="flex-1">
										<Text as="div" size="2" weight="bold" color="gray" mb="1">
											Pain Points
										</Text>
										<Text as="div" size="2">
											{publicThread.persona_details.pain_points}
										</Text>
									</Box>

									<Box className="flex-1">
										<Text as="div" size="2" weight="bold" color="gray" mb="1">
											Values
										</Text>
										<Text as="div" size="2">
											{publicThread.persona_details.values}
										</Text>
									</Box>
								</Flex>
							</Flex>
						</Box>
					</Box>
				</Flex>
			</Card>

			<ScrollArea type="hover" scrollbars="vertical" className="h-[600px]">
				<Box p="2">
					<Flex direction="column" gap="2">
						{publicThread.messages.length === 0 ? (
							<Box className="text-center py-8">
								<Text color="gray">No messages in this thread.</Text>
							</Box>
						) : (
							publicThread.messages.map((message: Message) => (
								<MessageBubble key={message.id} message={message} isUser={message.sender === "user"} />
							))
						)}
					</Flex>
				</Box>
			</ScrollArea>
		</Container>
	);
}
