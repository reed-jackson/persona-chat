import { Button, Card, Heading, Text, TextField } from "@radix-ui/themes";
import { login, signup } from "@/app/login/actions";
import { IconLock, IconMail } from "@tabler/icons-react";

export default function Auth() {
	return (
		<Card size="3" className="w-full max-w-sm">
			<div className="flex flex-col gap-6">
				<div className="flex flex-col gap-2 text-center">
					<Heading size="6">Welcome to PersonaChat</Heading>
					<Text size="2" color="gray">
						Sign in or create an account to continue
					</Text>
				</div>

				<form action={login} className="flex flex-col gap-4">
					<div className="space-y-4">
						<TextField.Root name="email" type="email" placeholder="Email address" required>
							<TextField.Slot>
								<IconMail size={16} className="text-gray-400" />
							</TextField.Slot>
						</TextField.Root>

						<TextField.Root name="password" type="password" placeholder="Password" required>
							<TextField.Slot>
								<IconLock size={16} className="text-gray-400" />
							</TextField.Slot>
						</TextField.Root>
					</div>

					<div className="flex flex-col gap-2">
						<Button type="submit" size="3">
							Sign In
						</Button>
						<Button type="submit" formAction={signup} size="3" variant="soft">
							Create Account
						</Button>
					</div>
				</form>
			</div>
		</Card>
	);
}
