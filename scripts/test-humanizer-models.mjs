#!/usr/bin/env node
/**
 * Test humanizer models: run the same sample text through OpenAI and Anthropic
 * models and compare output + estimated cost. Run from project root with:
 *
 *   OPENAI_API_KEY=sk-... ANTHROPIC_API_KEY=sk-ant-... node scripts/test-humanizer-models.mjs
 *
 * Or load from .env.local (Node 20+):
 *   node --env-file=.env.local scripts/test-humanizer-models.mjs
 *
 * Or with dotenv: npx dotenv -e .env.local -- node scripts/test-humanizer-models.mjs
 */

const SAMPLE_TEXT = `Artificial intelligence has revolutionized many industries in recent years. It is important to note that machine learning algorithms can process large amounts of data efficiently. Furthermore, these technologies have the potential to transform how we work and communicate.`;

const HUMANIZE_SYSTEM = `You are a writing assistant. Rewrite the user's text so it sounds natural and human-written while keeping the same meaning. Vary sentence structure and word choice; avoid patterns that AI detectors flag. Output only the rewritten text, no preamble.`;

// Approximate $ per 1M tokens (check latest: platform.openai.com, anthropic.com)
const COSTS = {
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4o": { input: 2.5, output: 10 },
  "claude-3-5-haiku-20241022": { input: 0.8, output: 4 },
  "claude-3-5-sonnet-20241022": { input: 3, output: 15 },
};

async function openaiChat(model, systemPrompt, userText) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userText },
      ],
      max_tokens: 500,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI ${model}: ${res.status} ${err}`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content?.trim() ?? "";
  const usage = data.usage || {};
  return { content, usage: { input: usage.prompt_tokens || 0, output: usage.completion_tokens || 0 } };
}

async function anthropicMessages(model, systemPrompt, userText) {
  const res = await fetch(
    "https://api.anthropic.com/v1/messages",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 500,
        system: systemPrompt,
        messages: [{ role: "user", content: userText }],
      }),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic ${model}: ${res.status} ${err}`);
  }
  const data = await res.json();
  const content = data.content?.[0]?.text?.trim() ?? "";
  const usage = data.usage || {};
  return {
    content,
    usage: {
      input: usage.input_tokens || 0,
      output: usage.output_tokens || 0,
    },
  };
}

function estCost(model, usage) {
  const c = COSTS[model];
  if (!c) return null;
  const inCost = (usage.input / 1e6) * c.input;
  const outCost = (usage.output / 1e6) * c.output;
  return (inCost + outCost).toFixed(6);
}

const MODELS = [
  { id: "gpt-4o-mini", run: openaiChat },
  { id: "gpt-4o", run: openaiChat },
  { id: "claude-3-5-haiku-20241022", run: anthropicMessages },
  { id: "claude-3-5-sonnet-20241022", run: anthropicMessages },
];

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("Missing OPENAI_API_KEY. Set it or use .env.local with dotenv.");
    process.exit(1);
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Missing ANTHROPIC_API_KEY. Set it or use .env.local with dotenv.");
    process.exit(1);
  }

  console.log("Sample input:\n");
  console.log(SAMPLE_TEXT);
  console.log("\n--- Humanized outputs and estimated cost ---\n");

  for (const { id, run } of MODELS) {
    try {
      const { content, usage } = await run(HUMANIZE_SYSTEM, SAMPLE_TEXT);
      const cost = estCost(id, usage);
      console.log(`[${id}]`);
      console.log(content);
      console.log(`Tokens: ${usage.input} in, ${usage.output} out. Est. cost: $${cost ?? "?"}`);
      console.log("");
    } catch (e) {
      console.log(`[${id}] ERROR: ${e.message}\n`);
    }
  }
}

main();
