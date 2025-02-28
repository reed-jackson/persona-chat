import { createClient } from "@/utils/supabase/client";
import { Database } from "@/types/supabase";

export type Persona = Database["public"]["Tables"]["personas"]["Row"];

export type Thread = Database["public"]["Tables"]["threads"]["Row"];

export type Message = Database["public"]["Tables"]["messages"]["Row"];

export type WorkplaceContext = Database["public"]["Tables"]["workplace_context"]["Row"];

export type WorkplaceContextInput = Omit<WorkplaceContext, "id" | "user_id" | "created_at" | "updated_at">;

const supabase = createClient();

export async function createPersona(persona: Omit<Persona, "id" | "created_at" | "updated_at" | "user_id">) {
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) throw new Error("User not authenticated");

	const { data, error } = await supabase
		.from("personas")
		.insert([
			{
				...persona,
				user_id: user.id,
				is_deleted: false,
			},
		])
		.select()
		.single();

	console.log(data);
	console.log(error);

	if (error) throw error;
	return data;
}

export async function getPersonas() {
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) throw new Error("User not authenticated");

	const { data, error } = await supabase
		.from("personas")
		.select("*")
		.eq("user_id", user.id)
		.eq("is_deleted", false)
		.order("created_at", { ascending: false });

	if (error) throw error;
	return data;
}

export async function updatePersona(id: string, updates: Partial<Persona>) {
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) throw new Error("User not authenticated");

	const { data, error } = await supabase
		.from("personas")
		.update(updates)
		.eq("id", id)
		.eq("user_id", user.id)
		.select()
		.single();

	if (error) throw error;
	return data;
}

export async function deletePersona(id: string) {
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) throw new Error("User not authenticated");

	// Soft delete by setting is_deleted flag
	const { error } = await supabase.from("personas").update({ is_deleted: true }).eq("id", id).eq("user_id", user.id);

	if (error) throw error;
	return true;
}

export async function createThread(personaId: string, title: string) {
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) throw new Error("User not authenticated");

	const { data, error } = await supabase
		.from("threads")
		.insert([
			{
				persona_id: personaId,
				user_id: user.id,
				title,
			},
		])
		.select()
		.single();

	if (error) throw error;
	return data;
}

export async function getThreads(personaId: string) {
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) throw new Error("User not authenticated");

	const { data, error } = await supabase
		.from("threads")
		.select("*")
		.eq("user_id", user.id)
		.eq("persona_id", personaId)
		.order("created_at", { ascending: false });

	if (error) throw error;
	return data;
}

export async function createMessage(threadId: string, content: string, sender: "user" | "persona") {
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) throw new Error("User not authenticated");

	const { data, error } = await supabase
		.from("messages")
		.insert([
			{
				thread_id: threadId,
				content,
				sender,
			},
		])
		.select()
		.single();

	if (error) throw error;
	return data;
}

export async function getMessages(threadId: string) {
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) throw new Error("User not authenticated");

	const { data, error } = await supabase
		.from("messages")
		.select("*")
		.eq("thread_id", threadId)
		.order("created_at", { ascending: true });

	if (error) throw error;
	return data;
}

export async function getWorkplaceContext() {
	const supabase = await createClient();
	const { data, error } = await supabase.from("workplace_context").select("*").single();

	if (error) {
		console.error("Error fetching workplace context:", error);
		return null;
	}

	return data as WorkplaceContext;
}

export async function saveWorkplaceContext(context: WorkplaceContextInput) {
	const supabase = await createClient();
	const { data: existing } = await supabase.from("workplace_context").select("id").single();

	if (existing) {
		// Update existing record
		const { data, error } = await supabase
			.from("workplace_context")
			.update(context)
			.eq("id", existing.id)
			.select()
			.single();

		if (error) {
			console.error("Error updating workplace context:", error);
			throw error;
		}

		return data as WorkplaceContext;
	} else {
		// Insert new record
		const { data, error } = await supabase.from("workplace_context").insert(context).select().single();

		if (error) {
			console.error("Error inserting workplace context:", error);
			throw error;
		}

		return data as WorkplaceContext;
	}
}

export async function updateThread(threadId: string, updates: Partial<Thread>) {
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) throw new Error("User not authenticated");

	const { data, error } = await supabase
		.from("threads")
		.update(updates)
		.eq("id", threadId)
		.eq("user_id", user.id)
		.select()
		.single();

	if (error) throw error;
	return data;
}

export async function updateUserEmail(email: string) {
	const supabase = createClient();
	const { data, error } = await supabase.auth.updateUser({ email });

	if (error) throw error;
	return data;
}

export async function updateUserPassword(password: string) {
	const supabase = createClient();
	const { data, error } = await supabase.auth.updateUser({ password });
	if (error) throw error;
	return data;
}

export async function logout() {
	const supabase = createClient();
	const { error } = await supabase.auth.signOut();
	if (error) throw error;
	return true;
}
