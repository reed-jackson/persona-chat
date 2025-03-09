import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

export const maxDuration = 30;

export async function POST(req: Request) {
	try {
		const { company_name, product_name, description, industry, target_audience } = await req.json();

		const result = await generateText({
			model: anthropic("claude-3-7-sonnet-20250219"),
			system: "You are an expert prompt engineer.",
			prompt: `You are tasked with creating a system prompt that will be used to contextualize AI model responses for a specific company. This prompt will help tailor the AI's interactions to align with the company's identity and customer base. Follow these instructions carefully to craft an effective system prompt.

You will be provided with the following information:

<company_name>
${company_name}
</company_name>

<product_or_service>
${product_name}
</product_or_service>

<company_description>
${description}
</company_description>

<industry>
${industry}
</industry>

<customer_description>
${target_audience}
</customer_description>

Your goal is to create a summary of this company that accomplishes the following:

1. Can be used to introduce the company to a new customer
2. Briefly describes the company's main product or service
3. Outlines how the customer might interact with the product or service
4. Sets the tone for interactions based on the company's profile

Before crafting the final output, use <planning> tags to brainstorm and plan your approach. Consider the following:

a) List key characteristics of the customer base
b) Identify main features/benefits of the product/service
c) Brainstorm typical customer interactions or use cases
d) Determine appropriate tone and language style

After your thought process, create the final output within <output> tags. The output should be concise yet informative, and should guide inform future AI interactions with information about the company.

Guidelines for the system prompt:
- Keep it between 50-100 words
- Avoid including unnecessary details or making assumptions beyond the provided information
- Ensure the prompt sets the stage for customer-centric interactions

Remember, your final output should consist of only the output inside <planning> and <output> tags. Do not include any explanations, justifications, or additional comments outside of these tags, and do not duplicate or rehash any of the work you did in the prompt planning section.
`,
		});

		// Extract just the output content
		const outputMatch = result.text.match(/<output>([^]*?)<\/output>/);
		const cleanOutput = outputMatch ? outputMatch[1].trim() : "";

		console.log("result.text: ", result.text);
		console.log("cleanOutput: ", cleanOutput);

		return new Response(
			JSON.stringify({
				prompt: cleanOutput,
				planning: result.text.match(/<planning>([^]*?)<\/planning>/)?.[1]?.trim(),
			}),
			{
				headers: { "Content-Type": "application/json" },
			}
		);
	} catch (error) {
		console.error("Prompt generation error:", error);
		return new Response(JSON.stringify({ error: "Failed to generate prompt" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
}
