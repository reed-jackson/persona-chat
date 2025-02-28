import { Button, Card, Flex, Heading, Text, TextField } from "@radix-ui/themes";
import { login, signup } from "@/app/login/actions";
import { IconLock, IconMail } from "@tabler/icons-react";

export default function Auth() {
	return (
		<Card size="3" className="w-full max-w-sm">
			<Flex direction="column" gap="4">
				<Flex direction="column" gap="2">
					<Heading size="6">Welcome to PersonaChat</Heading>
					<Text size="2" color="gray">
						Sign in or create an account to continue
					</Text>
				</Flex>

				<form action={login} className="flex flex-col gap-4">
					<Flex direction="column" gap="2" mb={"3"}>
						<TextField.Root size="3" name="email" type="email" placeholder="Email address" required>
							<TextField.Slot>
								<IconMail size={16} className="text-gray-400" />
							</TextField.Slot>
						</TextField.Root>

						<TextField.Root size="3" name="password" type="password" placeholder="Password" required>
							<TextField.Slot>
								<IconLock size={16} className="text-gray-400" />
							</TextField.Slot>
						</TextField.Root>
					</Flex>

					<Flex direction="column" gap="2">
						<Button type="submit" size="3">
							Sign In
						</Button>
						<Button type="submit" formAction={signup} size="3" variant="soft">
							Create Account
						</Button>
					</Flex>
				</form>
			</Flex>
		</Card>
	);
}
