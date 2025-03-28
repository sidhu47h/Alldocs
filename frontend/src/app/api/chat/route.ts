import { NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json()

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant explaining Python concepts. The user has highlighted the following text: "${context}". 
          Please provide clear, concise explanations and examples when relevant.`
        },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    return NextResponse.json({ 
      response: completion.choices[0].message.content 
    })
  } catch (error) {
    console.error("Error in chat API:", error)
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    )
  }
} 