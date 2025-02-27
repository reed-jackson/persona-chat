import { Button, Card, Container, Flex, Grid, Heading, Text } from "@radix-ui/themes";
import Link from "next/link";
import { IconBrain, IconMessage, IconUsers } from "@tabler/icons-react";

export default function LandingPage() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-500 to-pink-500">
			<Container>
				<Grid columns="2" gap="8" className="w-full md:w-auto grid-cols-1 md:grid-cols-3">
					{/* Left Side: Headline and Buttons */}
					<Flex direction="column">
						<Heading size="9" className="mb-6">
							Transform Your Product Development
						</Heading>
						<Text size="5" className="mb-12">
							Engage with AI-driven personas to gain insights, save time, and enhance your product strategy.
						</Text>

						<Flex justify="center" gap="4">
							<Button size="4" className="px-8 bg-white text-indigo-500 hover:bg-opacity-90" asChild>
								<Link href="/login">Get Started</Link>
							</Button>
							<Button size="4" className="px-8 bg-white text-pink-500 hover:bg-opacity-90" asChild>
								<Link href="/app">Open App</Link>
							</Button>
						</Flex>
					</Flex>

					{/* Right Side: Feature Boxes */}
					<Grid columns="1" gap="8" className="w-full md:w-auto grid-cols-1 md:grid-cols-3">
						<Card className="p-6 bg-white bg-opacity-10 rounded-lg">
							<IconUsers className="w-12 h-12 mx-auto mb-4" />
							<Text size="4" className="font-bold">
								Create Personas
							</Text>
							<Text>Create detailed user personas with unique traits.</Text>
						</Card>
						<Card className="p-6 bg-white bg-opacity-10 rounded-lg">
							<IconMessage className="w-12 h-12 mx-auto mb-4" />
							<Text size="4" className="font-bold">
								Chat Naturally
							</Text>
							<Text>Engage in lifelike conversations with AI personas.</Text>
						</Card>
						<Card className="p-6 bg-white bg-opacity-10 rounded-lg">
							<IconBrain className="w-12 h-12 mx-auto mb-4" />
							<Text size="4" className="font-bold">
								Gain Insights
							</Text>
							<Text>Gather feedback quickly and efficiently.</Text>
						</Card>
					</Grid>
				</Grid>
			</Container>
		</div>
	);
}
