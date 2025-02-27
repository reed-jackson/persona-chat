import { createClient } from "./client";
import { Database } from "@/types/supabase";

type Message = Database["public"]["Tables"]["messages"]["Row"];

export const subscribeToMessages = (threadId: string, callback: (message: Message) => void) => {
	const supabase = createClient();

	const subscription = supabase
		.channel(`messages:thread_id=eq.${threadId}`)
		.on(
			"postgres_changes",
			{
				event: "INSERT",
				schema: "public",
				table: "messages",
				filter: `thread_id=eq.${threadId}`,
			},
			(payload) => {
				const newMessage = payload.new as Message;
				callback(newMessage);
			}
		)
		.subscribe();

	return () => {
		subscription.unsubscribe();
	};
};

export const subscribeToThreadMessages = (userId: string, callback: (message: Message) => void) => {
	const supabase = createClient();

	const subscription = supabase
		.channel(`messages:user_threads`)
		.on(
			"postgres_changes",
			{
				event: "INSERT",
				schema: "public",
				table: "messages",
				filter: `thread_id=in.(SELECT id FROM threads WHERE user_id=eq.${userId})`,
			},
			(payload) => {
				const newMessage = payload.new as Message;
				callback(newMessage);
			}
		)
		.subscribe();

	return () => {
		subscription.unsubscribe();
	};
};
