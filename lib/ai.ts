import { generateText } from "ai";
import { type Message } from "./supabase";
import { anthropic } from "@ai-sdk/anthropic";

export type AIMessage = {
	role: "user" | "assistant" | "system";
	content: string;
};

export async function generatePersonaResponse({
	messages,
	systemPrompt,
}: {
	messages: Message[];
	systemPrompt: string;
}): Promise<string> {
	try {
		const aiMessages: AIMessage[] = [
			...messages.map((msg) => ({
				role: msg.sender === "user" ? ("user" as const) : ("assistant" as const),
				content: msg.content,
			})),
		];

		const result = await generateText({
			model: anthropic("claude-3-5-haiku-20241022"),
			system: systemPrompt,
			messages: aiMessages,
			temperature: 0.8,
			maxTokens: 200,
		});

		return result.text;
	} catch (error) {
		console.error("❌ AI Error:", error);
		throw error;
	}
}
