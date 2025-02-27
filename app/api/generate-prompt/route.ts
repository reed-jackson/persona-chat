import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { createClient } from "@/utils/supabase/server";

export const maxDuration = 30;

export async function POST(req: Request) {
	try {
		const { name, age, experience, personality, pain_points, values } = await req.json();
		const supabase = await createClient();

		// Get workplace context if available
		const { data: workplaceContext } = await supabase.from("workplace_context").select("*").single();

		let contextPrompt = "";
		if (workplaceContext) {
			contextPrompt = `
            Company/Product Context:
            - Company: ${workplaceContext.company_name}
            - Product: ${workplaceContext.product_name}
            - Description: ${workplaceContext.description}
            - Industry: ${workplaceContext.industry}
            - Target Audience: ${workplaceContext.target_audience}
            
            The persona should provide feedback specifically about ${workplaceContext.product_name} and its features, 
            considering the target audience of ${workplaceContext.target_audience} and the ${workplaceContext.industry} industry context.`;
		}

		const result = await generateText({
			model: openai("gpt-4"),
			system:
				"You are an expert at creating system prompts for AI user personas. Generate a detailed system prompt that will help an AI model accurately simulate the persona in a chat conversation with the user.",
			prompt: `Create a system prompt for an AI persona with these characteristics:
            Name: ${name}
            Age: ${age}
            Experience: ${experience}
            Personality: ${personality}
            Pain Points: ${pain_points}
            Values: ${values}

            They are simulating a user or prospect of the product with the following context:
            ${contextPrompt}
            
            The prompt should:
            1. Instruct the AI to embody the persona's traits and background
            2. Guide responses to be natural and in-character
            3. Focus on providing actionable feedback about products/features${
													workplaceContext ? `, especially ${workplaceContext.product_name}` : ""
												}
            4. Include specific examples of how to respond based on the persona's characteristics
            5. Keep responses concise but meaningful${
													workplaceContext
														? `\n6. Always consider the product, industry, and target audience context in responses`
														: ""
												}`,
		});

		return new Response(JSON.stringify({ prompt: result.text }), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("Prompt generation error:", error);
		return new Response(JSON.stringify({ error: "Failed to generate prompt" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
}
