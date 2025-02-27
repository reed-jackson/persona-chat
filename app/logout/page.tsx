"use client";

import { logout } from "@/app/actions";
import { Button, Container, Flex, Heading, Text } from "@radix-ui/themes";
import Link from "next/link";

export default function LogoutPage() {
	return (
		<Container>
			<Flex direction="column" gap="4" align="center" justify="center" className="min-h-screen">
				<Heading size="6">Sign Out</Heading>
				<Text>Are you sure you want to sign out?</Text>
				<Flex gap="4">
					<Button variant="solid" color="red" onClick={() => logout()}>
						Yes, Sign Out
					</Button>
					<Button variant="outline" asChild>
						<Link href="/app">Cancel</Link>
					</Button>
				</Flex>
			</Flex>
		</Container>
	);
}
