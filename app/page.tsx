import { Button, Card, Container, Flex, Heading, Text } from "@radix-ui/themes";
import Link from "next/link";

export default function LandingPage() {
	return (
		<Container className="py-20">
			<Card size="4" className="max-w-4xl mx-auto">
				<Flex direction="column" gap="6" align="center" className="text-center">
					<Heading size="8" className="tracking-tight">
						Welcome to PersonaChat
					</Heading>

					<Text size="5" color="gray" className="max-w-2xl">
						Create, manage, and chat with user personas to get valuable feedback for your product development process.
					</Text>

					<Flex gap="4">
						<Button size="4" asChild>
							<Link href="/login">Get Started</Link>
						</Button>
						<Button size="4" variant="soft" asChild>
							<Link href="/app">Open App</Link>
						</Button>
					</Flex>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
						<Card>
							<Flex direction="column" gap="2">
								<Heading size="4">Create Personas</Heading>
								<Text>Define detailed user personas with custom personalities and backgrounds.</Text>
							</Flex>
						</Card>

						<Card>
							<Flex direction="column" gap="2">
								<Heading size="4">Chat Interface</Heading>
								<Text>Engage in natural conversations with AI-powered personas in an iMessage-style interface.</Text>
							</Flex>
						</Card>

						<Card>
							<Flex direction="column" gap="2">
								<Heading size="4">Bulk Message</Heading>
								<Text>Send messages to multiple personas at once to gather diverse feedback efficiently.</Text>
							</Flex>
						</Card>
					</div>
				</Flex>
			</Card>
		</Container>
	);
}
