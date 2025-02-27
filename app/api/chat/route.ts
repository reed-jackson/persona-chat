import { generatePersonaResponse } from "@/lib/ai";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
	try {
		const { threadId, content } = await req.json();
		const supabase = await createClient();

		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
		}

		// Get thread and persona details
		const { data: thread, error: threadError } = await supabase
			.from("threads")
			.select("*, personas(*)")
			.eq("id", threadId)
			.single();

		if (threadError) {
			throw threadError;
		}

		if (!thread || !thread.personas) {
			return NextResponse.json({ error: "Thread or persona not found" }, { status: 404 });
		}

		// Get workplace context
		const { data: workplaceContext } = await supabase.from("workplace_context").select("*").single();

		// Save user message
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
			throw userMessageError;
		}

		// Get thread messages for context
		const { data: messages } = await supabase
			.from("messages")
			.select("*")
			.eq("thread_id", threadId)
			.order("created_at", { ascending: true });

		if (!messages) {
			throw new Error("Failed to fetch messages");
		}

		// Enhance system prompt with workplace context if available
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
		const aiResponseText = await generatePersonaResponse({
			messages,
			systemPrompt: enhancedSystemPrompt,
		});

		// Save AI response to database
		const { error: aiMessageError } = await supabase
			.from("messages")
			.insert({
				thread_id: threadId,
				content: aiResponseText,
				sender: "persona",
			})
			.select()
			.single();

		if (aiMessageError) {
			console.error("🔴 aiMessageError", aiMessageError);
			throw aiMessageError;
		}

		return NextResponse.json({ response: aiResponseText });
	} catch {
		return NextResponse.json({ error: "Failed to process message" }, { status: 500 });
	}
}
