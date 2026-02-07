"use client";

import { useState, useRef, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const PRESETS = [
  {
    label: "Blog post",
    system: "You are an expert blog writer. Write engaging, well-structured blog content.",
    placeholder: "Write a blog post about...",
  },
  {
    label: "Marketing copy",
    system: "You are a marketing copywriter. Write compelling, conversion-focused copy.",
    placeholder: "Write marketing copy for...",
  },
  {
    label: "Email draft",
    system: "You are a professional email writer. Write clear, concise emails.",
    placeholder: "Draft an email about...",
  },
  {
    label: "General",
    system: "You are a helpful assistant.",
    placeholder: "Ask anything...",
  },
];

export default function AIPage() {
  const [preset, setPreset] = useState(0);
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;

    setOutput("");
    setLoading(true);
    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          systemPrompt: PRESETS[preset].system,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        setOutput("Error: Failed to generate response.");
        setLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        setOutput("Error: No response stream.");
        setLoading(false);
        return;
      }

      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const data = line.replace(/^data: /, "");
          if (data === "[DONE]") break;

          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              setOutput((prev) => prev + parsed.text);
            }
          } catch {
            // skip malformed chunks
          }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // User cancelled
      } else {
        setOutput("Error: Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleStop() {
    abortRef.current?.abort();
    setLoading(false);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">AI Content Generator</h1>
        <p className="mt-1 text-muted-foreground">
          Generate content using Claude AI
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Input */}
        <Card>
          <CardHeader>
            <CardTitle>Prompt</CardTitle>
            <CardDescription>
              Choose a content type and describe what you need
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Content type</Label>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((p, i) => (
                    <Button
                      key={p.label}
                      type="button"
                      size="sm"
                      variant={preset === i ? "default" : "outline"}
                      onClick={() => setPreset(i)}
                    >
                      {p.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="prompt">Your prompt</Label>
                <textarea
                  id="prompt"
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder={PRESETS[preset].placeholder}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={loading || !prompt.trim()}>
                  {loading ? "Generating..." : "Generate"}
                </Button>
                {loading && (
                  <Button type="button" variant="outline" onClick={handleStop}>
                    Stop
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Output */}
        <Card>
          <CardHeader>
            <CardTitle>Output</CardTitle>
            <CardDescription>
              {loading
                ? "Generating..."
                : output
                  ? "Generation complete"
                  : "Your generated content will appear here"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {output ? (
              <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
                {output}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Enter a prompt and click Generate to get started.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
