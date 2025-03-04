import { generateText } from "ai";
import { type Message } from "./supabase";
import { anthropic } from "@ai-sdk/anthropic";
// import { openai } from "@ai-sdk/openai";

export type AIMessage = {
	role: "user" | "assistant" | "system";
	content: string;
	id?: string;
	createdAt?: string;
};

export type AIMessageWithMetadata = AIMessage & {
	id: string;
	createdAt: string;
};

export async function generatePersonaResponse({
	messages,
	systemPrompt,
}: {
	messages: Message[];
	systemPrompt: string;
}): Promise<string> {
	try {
		// Convert messages to AI format, excluding any system messages
		const aiMessages: AIMessage[] = messages
			.filter((msg) => msg.sender !== "system")
			.map((msg) => ({
				role: msg.sender === "user" ? "user" : "assistant",
				content: msg.content,
				id: msg.id,
				createdAt: msg.created_at,
			}));

		console.log("💭 [AI] Messages being sent to AI:", {
			systemPrompt: systemPrompt.substring(0, 100) + "...",
			messageCount: aiMessages.length,
			lastMessage: aiMessages[aiMessages.length - 1]?.content.substring(0, 50) + "...",
			aiMessages,
		});

		const result = await generateText({
			model: anthropic("claude-3-5-haiku-20241022"),
			system: systemPrompt, // Pass system prompt separately
			messages: aiMessages.map(({ content, role }) => ({ content, role })), // Only pass chat messages
			temperature: 0.8,
			maxTokens: 200,
		});

		return result.text;
	} catch (error) {
		console.error("❌ AI Error:", error);
		throw error;
	}
}

// Helper function to prepare messages for storage
export function prepareMessagesForStorage(messages: AIMessage[]): AIMessageWithMetadata[] {
	return messages.map((msg) => ({
		...msg,
		id: msg.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
		createdAt: msg.createdAt || new Date().toISOString(),
	}));
}

// Helper function to format messages for the AI
export function formatMessagesForAI(messages: AIMessageWithMetadata[]): AIMessage[] {
	return messages.map(({ content, role }) => ({
		content,
		role,
	}));
}
