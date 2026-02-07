import { getAnthropic, AI_MODEL } from "@/lib/ai";

export async function POST(request: Request) {
  try {
    const { prompt, systemPrompt } = (await request.json()) as {
      prompt: string;
      systemPrompt?: string;
    };

    if (!prompt) {
      return Response.json({ error: "Prompt is required" }, { status: 400 });
    }

    const stream = getAnthropic().messages.stream({
      model: AI_MODEL,
      max_tokens: 1024,
      system: systemPrompt || "You are a helpful assistant.",
      messages: [{ role: "user", content: prompt }],
    });

    // Convert Anthropic SDK stream to a ReadableStream for the response
    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        stream.on("text", (text) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
        });

        stream.on("error", (err) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: String(err) })}\n\n`)
          );
          controller.close();
        });

        stream.on("end", () => {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        });
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("AI route error:", err);
    return Response.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
