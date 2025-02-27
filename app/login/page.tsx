import Auth from "@/components/Auth";
import { createClient } from "@/utils/supabase/server";
import { Container } from "@radix-ui/themes";
import { redirect } from "next/navigation";

export default async function LoginPage() {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (user) {
		redirect("/");
	}

	return (
		<Container>
			<div className="min-h-screen flex items-center justify-center p-4">
				<Auth />
			</div>
		</Container>
	);
}
