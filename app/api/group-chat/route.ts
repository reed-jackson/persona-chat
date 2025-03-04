import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { generatePersonaResponse, type AIMessage } from "@/lib/ai";
import { type Message, type Persona } from "@/lib/supabase";

type PersonaGroupMember = {
	personas: Persona;
};

type PersonaGroup = {
	id: string;
	name: string;
	persona_group_members: PersonaGroupMember[];
};

type OrchestratorMessage = {
	sender: string;
	content: string;
	id: string;
	thread_id: string;
	created_at: string;
};

type OrchestratorDecision = {
	responder: string;
	reason: string;
};

type WorkplaceContext = {
	company_name: string;
	product_name: string;
	description: string;
	industry: string;
	target_audience: string;
};

const ORCHESTRATOR_SYSTEM_PROMPT = `You are an orchestrator for a group chat in PersonaChat, a tool for product growth teams.
Your role is to decide which persona should respond next or if the user should respond.
Consider:
1. The flow of conversation and turn-taking
2. Each persona's expertise and relevance to the topic
3. Natural conversation dynamics (don't always have everyone respond)
4. When the user needs to provide more input

Respond with JSON in this format ONLY:
{
    "responder": "persona_name or user",
    "reason": "brief explanation of why this responder was chosen"
}`;

// Helper function to generate enhanced system prompt
function getEnhancedSystemPrompt(persona: Persona, workplaceContext: WorkplaceContext | null) {
	if (!workplaceContext) return persona.system_prompt;

	return `Context about the company/product:
Company: ${workplaceContext.company_name}
Product: ${workplaceContext.product_name}
Description: ${workplaceContext.description}
Industry: ${workplaceContext.industry}
Target Audience: ${workplaceContext.target_audience}

Original Persona Instructions:
${persona.system_prompt}

CONVERSATION STYLE GUIDELINES:
- You are having a casual text message conversation with a Product Manager
- Write like you're texting: use natural, conversational language
- Keep responses concise
- Speak from your authentic experience and perspective as a potential customer
- Focus on your needs and pain points rather than specific product features
- Examples of good responses:
  - "In my day-to-day work, I really need..."
  - "The biggest challenge for me is..."
  - "What matters most to me is..."
  - "My team would benefit from..."
- As the conversation get longer, you can get more specific and detailed
- As the conversation get longer, make sure to vary the cadence of your messages to be more natural
- DO NOT reference or assume specific product features exist
- DO NOT include any actions, gestures, or roleplay
- It's ok to use:
  - Brief responses ("That makes sense")
  - Common emojis (sparingly)
  - Multiple short messages instead of one long one
- Stay in character as ${persona.name} but focus on natural dialogue

You are texting with a Product manager for ${workplaceContext.company_name}. Share your authentic perspective and needs as ${persona.name}, focusing on your real-world challenges and what would help you most in ${workplaceContext.product_name}'s space.`;
}

export async function POST(req: Request) {
	console.log("🚀 [GROUP-CHAT] Starting request processing");
	try {
		const { threadId, content, groupId } = await req.json();
		console.log("📝 [GROUP-CHAT] Request params:", {
			threadId,
			groupId,
			hasContent: !!content,
			isRecursiveCall: !content,
		});

		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			console.log("❌ [GROUP-CHAT] Authentication failed");
			return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
		}
		console.log("✅ [GROUP-CHAT] User authenticated:", user.id);

		// Get group and messages
		const { data: group } = await supabase
			.from("persona_groups")
			.select("*, persona_group_members(personas(*))")
			.eq("id", groupId)
			.single();

		console.log("👥 [GROUP-CHAT] Found group:", group?.name);

		const { data: messages } = await supabase
			.from("messages")
			.select("*")
			.eq("thread_id", threadId)
			.order("created_at", { ascending: true });

		console.log(`💬 [GROUP-CHAT] Loaded ${messages?.length ?? 0} messages from thread`);

		const { data: workplaceContext } = await supabase.from("workplace_context").select("*").single();
		console.log("🏢 [GROUP-CHAT] Workplace context loaded:", !!workplaceContext);

		const typedGroup = group as unknown as PersonaGroup;

		// Format data for orchestrator
		const personas = typedGroup.persona_group_members.map((member) => ({
			name: member.personas.name,
			personality: member.personas.personality,
			experience: member.personas.experience,
			system_prompt: member.personas.system_prompt,
		}));

		console.log(`👤 [GROUP-CHAT] Group members: ${personas.map((p) => p.name).join(", ")}`);

		const messageHistory: OrchestratorMessage[] =
			messages?.map((m) => ({
				sender: m.sender,
				content: m.content,
				id: m.id,
				thread_id: m.thread_id,
				created_at: m.created_at,
			})) ?? [];

		// Make orchestrator call with system prompt properly separated
		console.log("🎭 [GROUP-CHAT] Calling orchestrator...");
		const orchestratorResponse = await generatePersonaResponse({
			messages: [
				{
					sender: "user",
					content: JSON.stringify({
						personas,
						messageHistory,
						newMessage: content ? { sender: "user", content } : messageHistory[messageHistory.length - 1],
					}),
					id: `temp-${Date.now()}`,
					thread_id: threadId,
					created_at: new Date().toISOString(),
				},
			],
			systemPrompt: ORCHESTRATOR_SYSTEM_PROMPT,
		});

		let orchestratorDecision: OrchestratorDecision;
		try {
			orchestratorDecision = JSON.parse(orchestratorResponse);
			console.log("🎯 [GROUP-CHAT] Orchestrator decision:", {
				nextUp: orchestratorDecision.responder,
				why: orchestratorDecision.reason,
			});
		} catch {
			console.error("❌ [GROUP-CHAT] Failed to parse orchestrator response");
			throw new Error("Invalid orchestrator response");
		}

		// If orchestrator decides user should respond, we're done
		if (orchestratorDecision.responder === "user") {
			console.log("👋 [GROUP-CHAT] Waiting for user response");
			return NextResponse.json({
				shouldWaitForUser: true,
				reason: orchestratorDecision.reason,
			});
		}

		// Find the selected persona
		const selectedPersona = typedGroup.persona_group_members.find(
			(member) => member.personas.name === orchestratorDecision.responder
		)?.personas;

		if (!selectedPersona) {
			console.error("❌ [GROUP-CHAT] Selected persona not found:", orchestratorDecision.responder);
			throw new Error("Selected persona not found");
		}
		console.log("🎭 [GROUP-CHAT] Selected persona:", selectedPersona.name);

		// If this is a new message from the user, save it first
		if (content) {
			console.log("💾 [GROUP-CHAT] Saving user message...");
			const { data: userMessage } = await supabase
				.from("messages")
				.insert({
					thread_id: threadId,
					content,
					sender: "user",
				})
				.select()
				.single();
			console.log("✅ [GROUP-CHAT] User message saved with ID:", userMessage?.id);
		}

		// Get enhanced system prompt for the selected persona
		const enhancedSystemPrompt = getEnhancedSystemPrompt(selectedPersona, workplaceContext);

		// Generate persona response with proper message formatting
		console.log(
			"🤖 [GROUP-CHAT] Generating response from",
			selectedPersona.name,
			"with message history length:",
			messageHistory.length
		);

		const aiMessages: AIMessage[] = messageHistory.map((m) => ({
			role: m.sender === "user" ? "user" : "assistant",
			content: m.content,
			id: m.id,
			createdAt: m.created_at,
		}));

		if (content) {
			aiMessages.push({
				role: "user",
				content,
				id: `temp-${Date.now()}`,
				createdAt: new Date().toISOString(),
			});
		}

		const aiResponseText = await generatePersonaResponse({
			messages: aiMessages.map((m) => ({
				sender: m.role === "user" ? "user" : m.role === "assistant" ? m.content.split(":")[0] : "system",
				content: m.content,
				id: m.id,
				created_at: m.createdAt,
			})) as Message[],
			systemPrompt: enhancedSystemPrompt,
		});

		if (!aiResponseText || aiResponseText.trim() === "") {
			console.error("❌ [GROUP-CHAT] Generated empty response from AI");
			throw new Error("AI generated empty response");
		}

		console.log("💭 [GROUP-CHAT] Generated response:", {
			length: aiResponseText.length,
			preview: aiResponseText.substring(0, 100) + "...",
			isBlank: !aiResponseText || aiResponseText.trim() === "",
		});

		// Save persona response
		console.log("💾 [GROUP-CHAT] Saving AI response...");
		const { data: aiMessage, error: saveError } = await supabase
			.from("messages")
			.insert({
				thread_id: threadId,
				content: aiResponseText,
				sender: selectedPersona.name,
			})
			.select()
			.single();

		if (saveError) {
			console.error("❌ [GROUP-CHAT] Error saving AI message:", saveError);
			throw saveError;
		}

		if (!aiMessage) {
			console.error("❌ [GROUP-CHAT] No message data returned after save");
			throw new Error("Failed to save AI message");
		}

		console.log("✅ [GROUP-CHAT] AI message saved successfully:", {
			id: aiMessage.id,
			sender: aiMessage.sender,
			contentLength: aiMessage.content.length,
			preview: aiMessage.content.substring(0, 50) + "...",
		});

		return NextResponse.json({
			message: aiMessage,
			shouldWaitForUser: false,
			reason: orchestratorDecision.reason,
		});
	} catch (error) {
		console.error("❌ [GROUP-CHAT] Error in route handler:", error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Failed to process group chat" },
			{ status: 500 }
		);
	}
}
