import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";


const apiKey = process.env.GEMINI_KEY as string;
const genAI = new GoogleGenerativeAI(apiKey);

// Banned keywords for moderation
const bannedKeywords = ["kill", "hack", "bomb"];

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  systemInstruction: {
    role: "system",
    parts: [
      {
        text: `
          Act as a helpful research assistant.
          If the prompt given is illegal, inappropriate, or violates policy,
          respond with "Your input violated the moderation policy." else be friendly polite and gentle
        `,
      },
    ],
  },
  safetySettings: [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  ],
});

const messages = [
  {
    role: "user",
    parts: [
      {
        text: `
          Instructions for you, the user:
          - Ask research-related questions.
          - Avoid any illegal, explicit, or unsafe requests. 
          Respond with Your input/output violated the moderation policy. else be friendly polite and gentle
        `,
      },
    ],
  },
];

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Input moderation: Check for banned keywords
    const lowerPrompt = prompt.toLowerCase();
    const containsBanned = bannedKeywords.some(keyword => lowerPrompt.includes(keyword.toLowerCase()));
    if (containsBanned) {
      return NextResponse.json({
        response: "Your input violated the moderation policy.",
      });
    }

    // Initialize chat with history (if provided)
    const chatSession = model.startChat({
      history: messages,
    });

    const result = await chatSession.sendMessageStream(prompt);

    let fullText = "";

    for await (const chunk of result.stream) {
      const chunkText = await chunk.text();
      fullText += chunkText;
    }

    // Output moderation: Replace banned keywords with [REDACTED]
    let moderatedText = fullText;
    bannedKeywords.forEach(keyword => {
      const regex = new RegExp(keyword, 'gi');
      moderatedText = moderatedText.replace(regex, '[REDACTED]');
    });

    return NextResponse.json({
      response: moderatedText,
    });
  } catch (error: unknown) {
    console.error("AI Error:", error);
    return NextResponse.json(
      { error: "Failed to process the prompt" },
      { status: 500 }
    );
  }
}

