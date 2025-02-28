import { Button, Card, Container, Flex, Grid, Heading, Text } from "@radix-ui/themes";
import Link from "next/link";
import { IconBrain, IconMessage, IconUsers } from "@tabler/icons-react";

export default function LandingPage() {
	return (
		<Flex
			direction="column"
			align="center"
			gap="4"
			style={{
				paddingTop: "18svh",
				background: "radial-gradient(circle at bottom center, rgba(0, 0, 255, 0.1), rgba(0, 0, 200, 0.1), transparent)",
				height: "100svh",
			}}
		>
			<Container>
				{/* Left Side: Headline and Buttons */}
				<Flex direction="column" align="center" gap="4">
					<Heading size={{ initial: "8", md: "9" }} align="center">
						Transform Your Product Development
					</Heading>
					<Text size="5" className="mb-12" align="center">
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
				<Grid columns={{ initial: "1", md: "3" }} gap="2" mt={"8"}>
					<Card>
						<Flex direction="column" align="center" gap="2">
							<IconUsers className="w-12 h-12 mx-auto mb-4" />
							<Text size="4" weight="bold">
								Create Personas
							</Text>
							<Text align="center">Create detailed user personas with unique traits.</Text>
						</Flex>
					</Card>
					<Card>
						<Flex direction="column" align="center" gap="2">
							<IconMessage className="w-12 h-12 mx-auto mb-4" />
							<Text size="4" className="font-bold">
								Chat Naturally
							</Text>
							<Text>Engage in lifelike conversations with AI personas.</Text>
						</Flex>
					</Card>
					<Card>
						<Flex direction="column" align="center" gap="2">
							<IconBrain className="w-12 h-12 mx-auto mb-4" />
							<Text size="4" className="font-bold">
								Gain Insights
							</Text>
							<Text>Gather feedback quickly and efficiently.</Text>
						</Flex>
					</Card>
				</Grid>
			</Container>
		</Flex>
	);
}
