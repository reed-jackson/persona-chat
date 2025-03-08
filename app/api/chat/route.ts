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
			enhancedSystemPrompt = `${enhancedSystemPrompt}\n\nContext about the workplace:\nProduct: ${workplaceContext.product_name}\nTeam: ${workplaceContext.team_name}\nCompany: ${workplaceContext.company_name}`;
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

		let updatedTitle: string | undefined;

		// If this is the first AI response (2 messages total), generate a title
		if (messages.length === 1) {
			const titlePrompt = `Given this thread history:\nUser: ${content}\nAI: ${aiResponseText}\n\nGenerate a concise thread title (3-8 words) that reflects the conversation context and aligns with PersonaChat's goal of simulating product growth feedback for ${
				workplaceContext?.product_name || "the product"
			}. The title should be specific and descriptive.`;

			const titleResponse = await generatePersonaResponse({
				messages: [
					{ id: "1", thread_id: threadId, content: titlePrompt, sender: "user", created_at: new Date().toISOString() },
				],
				systemPrompt:
					"You are a helpful AI that generates concise, relevant titles. Respond with ONLY the title, no explanation or quotes.",
			});

			// Clean and validate the title
			const cleanTitle = titleResponse.replace(/["']/g, "").trim();
			const words = cleanTitle.split(/\s+/);
			const finalTitle = words.length > 8 ? words.slice(0, 8).join(" ") : cleanTitle;

			// Update thread title
			const { data: updatedThread } = await supabase
				.from("threads")
				.update({ title: finalTitle })
				.eq("id", threadId)
				.select()
				.single();

			if (updatedThread) {
				updatedTitle = updatedThread.title;
			}
		}

		return NextResponse.json({
			response: aiResponseText,
			...(updatedTitle && { updatedTitle }),
		});
	} catch (error) {
		console.error("Chat error:", error);
		return NextResponse.json({ error: "Failed to process message" }, { status: 500 });
	}
}
