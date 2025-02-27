import { Button } from "@radix-ui/themes";
import Link from "next/link";

export default function ErrorPage() {
	return (
		<div className="flex flex-col items-center justify-center min-h-screen p-4">
			<div className="text-center space-y-4">
				<h1 className="text-2xl font-bold">Authentication Error</h1>
				<p className="text-gray-600">There was an error during authentication. Please try again.</p>
				<Button asChild>
					<Link href="/login">Back to Login</Link>
				</Button>
			</div>
		</div>
	);
}
