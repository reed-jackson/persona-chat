import { generatePersonaResponse } from "@/lib/ai";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
	console.log("[CHAT] Starting request processing");
	try {
		const { threadId, content } = await req.json();
		console.log("[CHAT] Request params:", { threadId, contentLength: content.length });

		const supabase = await createClient();
		console.log("[CHAT] Supabase client created");

		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			console.log("[CHAT] No authenticated user found");
			return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
		}
		console.log("[CHAT] User authenticated:", user.id);

		// Get thread and persona details
		console.log("[CHAT] Fetching thread and persona details");
		const { data: thread, error: threadError } = await supabase
			.from("threads")
			.select("*, personas(*)")
			.eq("id", threadId)
			.single();

		if (threadError) {
			console.log("[CHAT] Thread fetch error:", threadError);
			throw threadError;
		}

		if (!thread || !thread.personas) {
			console.log("[CHAT] Thread or persona not found");
			return NextResponse.json({ error: "Thread or persona not found" }, { status: 404 });
		}
		console.log("[CHAT] Found thread with persona:", thread.personas.name);

		// Get workplace context
		console.log("[CHAT] Fetching workplace context");
		const { data: workplaceContext } = await supabase.from("workplace_context").select("*").single();
		console.log("[CHAT] Workplace context found:", !!workplaceContext);

		// Save user message
		console.log("[CHAT] Saving user message");
		const { error: userMessageError } = await supabase
			.from("messages")
			.insert({
				thread_id: threadId,
				content,
				sender: "user",
			})
			.select()
			.single();

		if (userMessageError) {
			console.log("[CHAT] Error saving user message:", userMessageError);
			throw userMessageError;
		}
		console.log("[CHAT] User message saved successfully");

		// Get thread messages for context
		console.log("[CHAT] Fetching thread messages");
		const { data: messages } = await supabase
			.from("messages")
			.select("*")
			.eq("thread_id", threadId)
			.order("created_at", { ascending: true });

		if (!messages) {
			console.log("[CHAT] No messages found for thread");
			throw new Error("Failed to fetch messages");
		}
		console.log("[CHAT] Found", messages.length, "messages in thread");

		// Enhance system prompt with workplace context if available
		console.log("[CHAT] Enhancing system prompt with workplace context");
		let enhancedSystemPrompt = thread.personas.system_prompt;
		if (workplaceContext) {
			enhancedSystemPrompt = `Context about the company/product:
Company: ${workplaceContext.company_name}
Product: ${workplaceContext.product_name}
Description: ${workplaceContext.description}
Industry: ${workplaceContext.industry}
Target Audience: ${workplaceContext.target_audience}

Original Persona Instructions:
${thread.personas.system_prompt}

CONVERSATION STYLE GUIDELINES:
- You are having a casual text message conversation with a Product Manager
- Write like you're texting: use natural, conversational language
- Keep responses concise.
- Speak from your authentic experience and perspective as a potential customer
- Focus on your needs and pain points rather than specific product features
- Examples of good responses:
  - "In my day-to-day work, I really need..."
  - "The biggest challenge for me is..."
  - "What matters most to me is..."
  - "My team would benefit from..."
- As the conversation get longer, you can get more specific and detailed.
- As the conversation get longer, make sure to vary the cadence of your messages to be more natural.
- DO NOT reference or assume specific product features exist
- DO NOT include any actions, gestures, or roleplay
- It's ok to use:
  - Brief responses ("That makes sense")
  - Common emojis (sparingly)
  - Multiple short messages instead of one long one
- Stay in character as ${thread.personas.name} but focus on natural dialogue

You are texting with a Product manager for ${workplaceContext.company_name}. Share your authentic perspective and needs as ${thread.personas.name}, focusing on your real-world challenges and what would help you most in ${workplaceContext.product_name}'s space.`;
		}

		// Generate AI response
		console.log("[CHAT] Generating persona response");
		const aiResponseText = await generatePersonaResponse({
			messages,
			systemPrompt: enhancedSystemPrompt,
		});
		console.log("[CHAT] Generated persona response, length:", aiResponseText.length);

		// Save AI response to database
		console.log("[CHAT] Saving persona response");
		const { data: aiMessage, error: aiMessageError } = await supabase
			.from("messages")
			.insert({
				thread_id: threadId,
				content: aiResponseText,
				sender: thread.personas.name, // Use persona name instead of "persona"
			})
			.select()
			.single();

		if (aiMessageError) {
			console.log("[CHAT] Error saving persona response:", aiMessageError);
			throw aiMessageError;
		}
		console.log("[CHAT] Persona response saved successfully");

		console.log("[CHAT] Request completed successfully");
		return NextResponse.json({ message: aiMessage });
	} catch (error) {
		console.error("[CHAT] Error in route handler:", error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Failed to process message" },
			{ status: 500 }
		);
	}
}
