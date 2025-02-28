"use client";

import { Button, Card, Flex, Heading, Text, TextField } from "@radix-ui/themes";
import { login, signup } from "@/app/login/actions";
import { IconLock, IconMail } from "@tabler/icons-react";
import { useState } from "react";
import React from "react";

export default function Auth() {
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setLoading(true);
		const formData = new FormData(event.currentTarget);
		try {
			await login(formData);
		} finally {
			setLoading(false);
		}
	};

	const handleSignup = async (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		setLoading(true);
		const form = event.currentTarget.form;
		if (form) {
			const formData = new FormData(form);
			try {
				await signup(formData);
			} finally {
				setLoading(false);
			}
		}
	};

	return (
		<Card size="3" style={{ width: "100%" }}>
			<Flex direction="column" gap="4">
				<Flex direction="column" gap="2">
					<Heading size="6">Welcome to PersonaChat</Heading>
					<Text size="2" color="gray">
						Sign in or create an account to continue
					</Text>
				</Flex>

				<form onSubmit={handleSubmit} className="flex flex-col gap-4">
					<Flex direction="column" gap="2" mb={"3"}>
						<TextField.Root size="3" name="email" type="email" placeholder="Email address" required disabled={loading}>
							<TextField.Slot>
								<IconMail size={16} className="text-gray-400" />
							</TextField.Slot>
						</TextField.Root>

						<TextField.Root size="3" name="password" type="password" placeholder="Password" required disabled={loading}>
							<TextField.Slot>
								<IconLock size={16} className="text-gray-400" />
							</TextField.Slot>
						</TextField.Root>
					</Flex>

					<Flex direction="column" gap="2">
						<Button type="submit" size="3" disabled={loading}>
							Sign In
						</Button>
						<Button type="button" onClick={handleSignup} size="3" variant="soft" disabled={loading}>
							Create Account
						</Button>
					</Flex>
				</form>
			</Flex>
		</Card>
	);
}
