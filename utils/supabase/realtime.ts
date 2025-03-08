import { createClient } from "./client";
import { Database } from "@/types/supabase";

type Message = Database["public"]["Tables"]["messages"]["Row"];
type Thread = Database["public"]["Tables"]["threads"]["Row"];

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

export const subscribeToThreadUpdates = (threadId: string, callback: (thread: Thread) => void) => {
	const supabase = createClient();

	const subscription = supabase
		.channel(`threads:id=eq.${threadId}`)
		.on(
			"postgres_changes",
			{
				event: "UPDATE",
				schema: "public",
				table: "threads",
				filter: `id=eq.${threadId}`,
			},
			(payload) => {
				const updatedThread = payload.new as Thread;
				callback(updatedThread);
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
