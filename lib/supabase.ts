import { createClient } from "@/utils/supabase/client";
import { Database } from "@/types/supabase";

export type Persona = Database["public"]["Tables"]["personas"]["Row"];

export type Thread = Database["public"]["Tables"]["threads"]["Row"] & {
	personas?: Persona;
	persona_groups?: PersonaGroupWithMembers;
	group_id?: string;
};

export type Message = Database["public"]["Tables"]["messages"]["Row"];

export type WorkplaceContext = Database["public"]["Tables"]["workplace_context"]["Row"];

export type WorkplaceContextInput = Omit<WorkplaceContext, "id" | "user_id" | "created_at" | "updated_at">;

export type PersonaGroup = {
	id: string;
	user_id: string;
	name: string;
	description: string | null;
	created_at: string;
	updated_at: string;
};

export type PersonaGroupWithMembers = PersonaGroup & {
	members: Persona[];
};

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

export async function createThread(personaId: string | null, title: string, groupId?: string) {
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) throw new Error("User not authenticated");

	const { data, error } = await supabase
		.from("threads")
		.insert([
			{
				persona_id: personaId, // Initial responder (for both individual and group chats)
				user_id: user.id,
				title,
				group_id: groupId,
			},
		])
		.select()
		.single();

	if (error) throw error;
	return data;
}

export async function getThread(threadId: string) {
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) throw new Error("User not authenticated");

	// First get the thread with basic persona and group info
	const { data: thread, error } = await supabase
		.from("threads")
		.select("*, personas(*), persona_groups(*)")
		.eq("id", threadId)
		.eq("user_id", user.id)
		.single();

	if (error) throw error;
	if (!thread) throw new Error("Thread not found");

	// If this is a group thread, fetch the group members
	if (thread.group_id && thread.persona_groups) {
		const { data: members, error: membersError } = await supabase
			.from("persona_group_members")
			.select("personas(*)")
			.eq("group_id", thread.group_id);

		if (membersError) throw membersError;

		// Enhance the thread data with group members
		return {
			...thread,
			persona_groups: {
				...thread.persona_groups,
				members: members.map((m) => m.personas),
			},
		};
	}

	return thread;
}

export async function getPersonaThreads(personaId: string) {
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) throw new Error("User not authenticated");

	const { data, error } = await supabase
		.from("threads")
		.select("*, personas(*)")
		.eq("user_id", user.id)
		.eq("persona_id", personaId)
		.is("group_id", null) // Only get individual threads
		.order("created_at", { ascending: false });

	if (error) throw error;
	return data;
}

export async function getGroupThreads(groupId: string) {
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) throw new Error("User not authenticated");

	const { data, error } = await supabase
		.from("threads")
		.select("*, persona_groups(*)")
		.eq("user_id", user.id)
		.eq("group_id", groupId)
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

	console.log(data);
	console.log(error);

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
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) throw new Error("User not authenticated");

		const contextWithUserId = {
			...context,
			user_id: user.id,
		};

		// Insert new record
		const { data, error } = await supabase.from("workplace_context").insert(contextWithUserId).select().single();

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

export async function createPersonaGroup(name: string, description: string | null, personaIds: string[]) {
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) throw new Error("User not authenticated");

	// Start a transaction
	const { data: group, error: groupError } = await supabase
		.from("persona_groups")
		.insert([
			{
				user_id: user.id,
				name,
				description,
			},
		])
		.select()
		.single();

	if (groupError) throw groupError;

	// Add members
	if (personaIds.length > 0) {
		const { error: membersError } = await supabase.from("persona_group_members").insert(
			personaIds.map((personaId) => ({
				group_id: group.id,
				persona_id: personaId,
			}))
		);

		if (membersError) throw membersError;
	}

	// Fetch the complete group with members
	const { data: members, error: membersError } = await supabase
		.from("persona_group_members")
		.select("personas(*)")
		.eq("group_id", group.id);

	if (membersError) throw membersError;

	// Return the group with its members
	return {
		...group,
		members: members.map((m) => m.personas),
	} as PersonaGroupWithMembers;
}

export async function getPersonaGroups(): Promise<PersonaGroupWithMembers[]> {
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) throw new Error("User not authenticated");

	const { data: groups, error: groupsError } = await supabase
		.from("persona_groups")
		.select("*")
		.order("created_at", { ascending: false });

	if (groupsError) throw groupsError;

	// Get members for each group
	const groupsWithMembers = await Promise.all(
		groups.map(async (group) => {
			const { data: members, error: membersError } = await supabase
				.from("persona_group_members")
				.select("personas(*)")
				.eq("group_id", group.id);

			if (membersError) throw membersError;

			return {
				...group,
				members: members.map((m) => m.personas),
			};
		})
	);

	return groupsWithMembers;
}

export async function updatePersonaGroup(
	groupId: string,
	updates: { name?: string; description?: string | null; personaIds?: string[] }
) {
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) throw new Error("User not authenticated");

	// Update group details if provided
	if (updates.name || updates.description !== undefined) {
		const { error: groupError } = await supabase
			.from("persona_groups")
			.update({
				...(updates.name ? { name: updates.name } : {}),
				...(updates.description !== undefined ? { description: updates.description } : {}),
			})
			.eq("id", groupId);

		if (groupError) throw groupError;
	}

	// Update members if provided
	if (updates.personaIds) {
		// Delete existing members
		const { error: deleteError } = await supabase.from("persona_group_members").delete().eq("group_id", groupId);

		if (deleteError) throw deleteError;

		// Add new members
		if (updates.personaIds.length > 0) {
			const { error: insertError } = await supabase.from("persona_group_members").insert(
				updates.personaIds.map((personaId) => ({
					group_id: groupId,
					persona_id: personaId,
				}))
			);

			if (insertError) throw insertError;
		}
	}

	// Return updated group with members
	const { data: group, error: groupError } = await supabase
		.from("persona_groups")
		.select("*")
		.eq("id", groupId)
		.single();

	if (groupError) throw groupError;

	const { data: members, error: membersError } = await supabase
		.from("persona_group_members")
		.select("personas(*)")
		.eq("group_id", groupId);

	if (membersError) throw membersError;

	return {
		...group,
		members: members.map((m) => m.personas),
	};
}

export async function deletePersonaGroup(groupId: string) {
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) throw new Error("User not authenticated");

	const { error } = await supabase.from("persona_groups").delete().eq("id", groupId);

	if (error) throw error;
}
