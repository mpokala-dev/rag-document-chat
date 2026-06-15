"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import ReactMarkdown from "react-markdown";
import DOMPurify from "dompurify";
import { useEffect, useRef, useState } from "react";

interface Props {
  documentId?: string;
  documentName: string;
}

export default function ChatInterface({ documentId, documentName }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [isAtBottom, setIsAtBottom] = useState(true);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest: ({ messages }) => ({
        body: { messages, documentId: documentId ?? null },
      }),
    }),
  });

  const isLoading = status === "streaming" || status === "submitted";

  // Smooth scroll to bottom only when user is already at bottom
  useEffect(() => {
    if (isAtBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, isAtBottom]);

  // Track whether user has scrolled up
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    setIsAtBottom(atBottom);
  };

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput("");
    setIsAtBottom(true);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-3 px-6 py-4 border-b border-slate-800 bg-slate-900/50">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-sm">
          {documentId ? "📄" : "⊕"}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-200 truncate max-w-md">
            {documentName}
          </p>
          <p className="text-xs text-slate-500">
            {documentId ? "Single document mode" : "Searching all documents"}
          </p>
        </div>
        {isLoading && (
          <div className="ml-auto flex items-center gap-1.5">
            <div
              className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <div
              className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            <div
              className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </div>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-6 py-6 space-y-6 min-h-0"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <p className="text-slate-400 text-sm">
              Ask anything about{" "}
              <span className="text-indigo-400">{documentName}</span>
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {[
                "Summarise this document",
                "What are the key points?",
                "Give me the main requirements",
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    sendMessage({ text: s });
                    setIsAtBottom(true);
                  }}
                  className="text-xs px-3 py-1.5 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors border border-slate-700"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.role === "assistant" && (
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xs flex-shrink-0 mt-1">
                ◈
              </div>
            )}

            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed
              ${
                m.role === "user"
                  ? "bg-indigo-600 text-white rounded-tr-sm"
                  : "bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700"
              }`}
            >
              <div className="[&_strong]:font-semibold [&_strong]:text-slate-100 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:my-2 [&_li]:my-0.5 [&_p]:my-1 [&_h1]:font-bold [&_h2]:font-semibold [&_h3]:font-semibold [&_h1]:my-2 [&_h2]:my-2 [&_h3]:my-1">
                {m.parts.map((part, i) => {
                  if (part.type !== "text") return null;
                  const text = part.text ?? "";
                  const isHTML = /<[a-z][\s\S]*>/i.test(text);
                  if (isHTML) {
                    return (
                      <div
                        key={i}
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(text),
                        }}
                        className="[&_h2]:font-bold [&_h2]:text-slate-100 [&_h2]:text-base [&_h2]:mb-2
                          [&_h3]:font-semibold [&_h3]:text-slate-200 [&_h3]:mb-1
                          [&_p]:my-1 [&_p]:leading-relaxed
                          [&_.question]:font-semibold [&_.question]:text-slate-100 [&_.question]:mt-3
                          [&_.answer]:text-slate-300 [&_.answer]:mt-0.5"
                      />
                    );
                  }
                  return <ReactMarkdown key={i}>{text}</ReactMarkdown>;
                })}
              </div>
            </div>

            {m.role === "user" && (
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-xs flex-shrink-0 mt-1 font-medium">
                M
              </div>
            )}
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xs flex-shrink-0">
              ◈
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-4">
                <div
                  className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <div
                  className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <div
                  className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Scroll to bottom button */}
      {!isAtBottom && (
        <button
          onClick={() => {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
            setIsAtBottom(true);
          }}
          className="absolute bottom-24 right-8 w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-300 hover:bg-slate-600 transition-colors shadow-lg"
        >
          ↓
        </button>
      )}

      {/* Input */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-slate-800 bg-slate-900/50">
        <form onSubmit={handleSubmit} className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Ask a question… (Enter to send, Shift+Enter for new line)"
              rows={1}
              disabled={isLoading}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200
                placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30
                disabled:opacity-50 resize-none leading-relaxed transition-colors"
              style={{ minHeight: "48px", maxHeight: "160px" }}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex-shrink-0 w-11 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40
              disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
