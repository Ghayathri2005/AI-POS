import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, createUIMessageStream, createUIMessageStreamResponse } from "ai";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export const maxDuration = 30;

// Detect if the user is asking to generate/create an image
function detectImageRequest(text: string): boolean {
  const lower = text.toLowerCase();
  const imageKeywords = [
    "generate an image",
    "generate image",
    "create an image",
    "create image",
    "draw an image",
    "draw image",
    "make an image",
    "make image",
    "generate a picture",
    "create a picture",
    "make a picture",
    "draw a picture",
    "generate a photo",
    "create a photo",
    "generate a painting",
    "create a painting",
    "generate art",
    "create art",
    "make art",
    "draw me",
    "generate me",
    "create me a",
    "show me a picture",
    "show me an image",
    "illustrate",
  ];
  return imageKeywords.some((kw) => lower.includes(kw));
}

// Extract the clean image subject from the user's message
function extractImagePrompt(userMessage: string): string {
  const cleaned = userMessage
    .replace(/^(please\s+)?(generate|create|draw|make|show|illustrate)\s+(me\s+)?(an?\s+)?(image|picture|photo|painting|illustration|art|artwork)(\s+of)?/i, "")
    .trim()
    .replace(/^[:\-\s]+/, "")
    .trim();
  return cleaned || userMessage;
}

// Extract plain text from incoming UIMessage parts array or legacy content string
function extractTextFromMessage(msg: any): string {
  if (Array.isArray(msg.parts)) {
    const text = msg.parts
      .filter((p: any) => p.type === "text")
      .map((p: any) => p.text ?? "")
      .join("");
    if (text) return text;
  }
  if (typeof msg.content === "string") {
    return msg.content;
  }
  return "";
}

// Build a minimal UIMessageChunk stream response from a plain text string
function textToUIMessageStreamResponse(text: string): Response {
  const messageId = `msg_${Math.random().toString(36).slice(2)}`;

  const stream = createUIMessageStream({
    execute: ({ writer }) => {
      writer.write({ type: "start", messageId } as any);
      writer.write({ type: "text-start", id: messageId });
      writer.write({ type: "text-delta", id: messageId, delta: text });
      writer.write({ type: "text-end", id: messageId });
      writer.write({ type: "finish", messageId } as any);
    },
  });

  return createUIMessageStreamResponse({ stream });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, model, conversationId } = body;
    const session = await auth();
    const userId = session?.user?.id;

    // Save User message if conversationId is provided
    if (userId && conversationId) {
      const lastUserMessage = messages[messages.length - 1];
      if (lastUserMessage && lastUserMessage.role === "user") {
        const userText = extractTextFromMessage(lastUserMessage);
        await prisma.message.create({
          data: {
            role: "user",
            content: userText,
            conversationId,
            model,
          },
        });

        // Auto-generate title if this is the first message
        const count = await prisma.message.count({ where: { conversationId } });
        if (count === 1) {
          const generatedTitle = userText.substring(0, 30) + (userText.length > 30 ? "..." : "");
          await prisma.conversation.update({
            where: { id: conversationId },
            data: { title: generatedTitle },
          });
        }
      }
    }

    let text = "";

    // ── IMAGE GENERATION DETECTION ───────────────────────────────────────────
    const lastMsg = messages[messages.length - 1];
    const userText: string = lastMsg?.role === "user" ? extractTextFromMessage(lastMsg) : "";

    if (detectImageRequest(userText)) {
      const imagePrompt = extractImagePrompt(userText);
      // Pollinations.ai — 100% free, no API key required, generates high-quality images
      const encodedPrompt = encodeURIComponent(imagePrompt);
      const seed = Math.floor(Math.random() * 999999);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${seed}&nologo=true&enhance=true&model=flux`;

      text = `[IMAGE_GEN|${imageUrl}|${imagePrompt}]`;

      if (userId && conversationId) {
        await prisma.message.create({
          data: { role: "assistant", content: text, conversationId, model },
        });
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });
      }

      return textToUIMessageStreamResponse(text);
    }
    // ────────────────────────────────────────────────────────────────────────

    // Convert UIMessage parts to plain role/content pairs for API calls
    const plainMessages = messages.map((m: any) => ({
      role: m.role as "user" | "assistant" | "system",
      content: extractTextFromMessage(m),
    }));

    // Check if the user selected Gemini
    if (model && model.includes("gemini")) {
      try {
        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!apiKey || apiKey === "your-google-ai-api-key") {
          throw new Error("Google Generative AI API key is not configured.");
        }

        // Always use the 100% free-tier Gemini Flash model
        const targetModel = "gemini-flash-latest";

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: plainMessages
                .filter((m: any) => m.role !== "system")
                .map((m: any) => ({
                  role: m.role === "user" ? "user" : "model",
                  parts: [{ text: m.content }],
                })),
              systemInstruction: {
                parts: [{ text: "You are AI-POS, a premium AI assistant." }],
              },
            }),
          }
        );

        if (!response.ok) {
          const errorJson = await response.json();
          throw new Error(errorJson.error?.message || "Failed to generate response from Gemini API.");
        }

        const data = await response.json();
        text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      } catch (apiError: any) {
        console.error("Gemini API Error, falling back to unlimited free Pollinations:", apiError.message);
        try {
          // 100% Free Fallback using Pollinations OpenAI-compatible endpoint
          const fallbackResponse = await fetch("https://text.pollinations.ai/openai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: [
                { role: "system", content: "You are AI-POS, a premium AI assistant." },
                ...plainMessages.map((m: any) => ({
                  role: m.role === "user" ? "user" : "assistant",
                  content: m.content
                }))
              ],
            }),
          });
          const fallbackData = await fallbackResponse.json();
          text = fallbackData.choices?.[0]?.message?.content || "Sorry, all AI services are currently overloaded.";
        } catch (fallbackError: any) {
          console.error("Fallback Error:", fallbackError);
          text = `Error: ${apiError.message}. Also failed to reach fallback.`;
        }
      }
    } else {
      // Default Vercel AI SDK route for other models (OpenAI/Anthropic)
      let providerModel;
      try {
        if (model && model.includes("claude")) {
          const hasAnthropicKey =
            process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== "your-anthropic-api-key";
          if (hasAnthropicKey) {
            providerModel = anthropic("claude-3-5-sonnet-20241022");
          } else {
            providerModel = openai("gpt-4o");
          }
        } else if (model && model.includes("gpt-4o")) {
          providerModel = openai("gpt-4o");
        } else if (model && model.includes("gpt-4-turbo")) {
          providerModel = openai("gpt-4-turbo");
        } else {
          providerModel = openai("gpt-4o-mini");
        }

        const result = await generateText({
          model: providerModel as any,
          messages: plainMessages,
          system: "You are AI-POS, a premium AI assistant.",
        });
        text = result.text;
      } catch (apiError: any) {
        console.error("Model API Error:", apiError);
        text = `Error: ${apiError.message}.`;
      }
    }

    // Save Assistant message if conversationId is provided
    if (userId && conversationId && text) {
      await prisma.message.create({
        data: { role: "assistant", content: text, conversationId, model },
      });
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });
    }

    return textToUIMessageStreamResponse(text);
  } catch (error: any) {
    console.error("CRITICAL API ERROR:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
