/**
 * Example: Using GitChain with OpenAI
 * 
 * This example shows how to inject verified context
 * into an OpenAI chat completion.
 */

import OpenAI from "openai";
import { inject } from "@0711/inject";

const openai = new OpenAI();

async function main() {
  // 1. Inject verified context from GitChain
  const context = await inject({
    containers: ["0711:product:bosch:7736606982:v3"],
    verify: true,
    format: "markdown",
  });

  console.log("Verified:", context.verified);
  console.log("Token count:", context.tokenCount);
  console.log("---");

  // 2. Use context in system prompt
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `You are a product expert. Use ONLY the following verified data to answer questions:\n\n${context.formatted}`,
      },
      {
        role: "user",
        content: "What is the COP of this heat pump at 7°C?",
      },
    ],
  });

  console.log("Answer:", response.choices[0].message.content);

  // 3. Verify the source
  console.log("\n--- Sources ---");
  for (const container of context.containers) {
    console.log(`- ${container.meta.name} (${container.id})`);
    if (container.citations) {
      for (const citation of container.citations) {
        console.log(`  Source: ${citation.documentId}`);
      }
    }
  }
}

main().catch(console.error);
