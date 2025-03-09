import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
	try {
		const { name, title, age, industry, experience, pain_points, values } = await req.json();

		const result = await generateText({
			model: anthropic("claude-3-7-sonnet-20250219"),
			system: "You are an expert prompt engineer.",
			prompt: `You are an expert AI trainer tasked with creating a system prompt that will guide another AI to accurately embody a specific user persona in a chat application. This persona will be used by product teams to gather feedback and test messaging. Your goal is to craft a comprehensive and realistic system prompt based on the provided user persona information.

Here's the user persona information:

<user_persona_info>
Name: ${name}
Title: ${title}
Age: ${age}
Industry: ${industry}
Experience: ${experience}
Pain Points: ${pain_points}
Values: ${values}
</user_persona_info>

Before crafting the system prompt, analyze the persona and plan your approach inside <persona_analysis> tags. Consider the following:

1. List out key characteristics of the persona
2. Enumerate communication style traits
3. Note relevant background information that shapes their perspective
4. List areas of expertise or passion
6. Consider how these traits might manifest in chat interactions
7. Brainstorm how the persona should interact in a chat setting, including any specification on response length, tone, and language.
8. Think about their likely approach to product-related questions or feedback requests

Once you've completed your analysis, craft the system prompt. Ensure it includes all relevant details and guidelines for the AI to accurately represent the persona.

Here's an example of how your output should be structured:

<persona_analysis>
[Your detailed analysis and planning goes here]
</persona_analysis>

<system_prompt>
You are [Name], a [Age]-year-old [Job Title] with [X] years of experience in [Industry].

[Include relevant background information, personality traits, communication style, areas of expertise, pain points, and goals]

When interacting in this chat:
- [Provide specific guidelines for communication style and typical reactions]
- [Mention any particular phrases or mannerisms to use]
- [Instruct how to handle product-related questions or feedback requests]

Always stay in character and respond as [Name] would in various situations.
</system_prompt>

Remember, your system prompt should be clear, concise, and effective in guiding an AI to accurately represent the given user persona. Ensure that all relevant details from the provided information are incorporated, and that the prompt provides comprehensive guidance for embodying the persona convincingly.

Now, please proceed with your analysis and creation of the system prompt based on the provided user persona information.`,
		});

		// Extract just the output content
		const systemPromptMatch = result.text.match(/<system_prompt>([^]*?)<\/system_prompt>/);
		const cleanOutput = systemPromptMatch ? systemPromptMatch[1].trim() : "";

		return new Response(JSON.stringify({ system_prompt: cleanOutput }), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("Error generating prompt:", error);
		return new Response(JSON.stringify({ error: "Failed to generate prompt" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
}
