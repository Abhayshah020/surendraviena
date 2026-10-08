"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
    Phone,
    MessageCircle,
    CalendarDays,
    Sparkles,
    Facebook,
    X,
    Send,
    Bot,
    User,
    Loader2,
} from "lucide-react";

const PHONE = "+9779804032442";
const WHATSAPP = "9779804032442";

type ChatMessage = {
    id: number;
    role: "assistant" | "user";
    text: string;
};

export default function FloatingActions() {
    const [chatOpen, setChatOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);

    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 1,
            role: "assistant",
            text: "Hello. I’m the health information assistant. How can I help you today?",
        },
    ]);

const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage || sending) return;

    const userMessage: ChatMessage = {
        id: Date.now(),
        role: "user",
        text: trimmedMessage,
    };

    // Save the current conversation before adding the new user message.
    const conversationHistory = messages.map((item) => ({
        role: item.role,
        content: item.text,
    }));

    setMessages((current) => [...current, userMessage]);
    setMessage("");
    setSending(true);

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: trimmedMessage,
                history: conversationHistory,
            }),
        });

        // Read as text first so an empty/non-JSON response does not
        // crash with "Unexpected end of JSON input".
        const rawResponse = await response.text();

        let data: {
            message?: string;
            error?: string;
        } = {};

        if (rawResponse) {
            try {
                data = JSON.parse(rawResponse);
            } catch (parseError) {
                console.error("Invalid API response:", rawResponse);
                throw new Error(
                    "The AI server returned an invalid response."
                );
            }
        }

        if (!response.ok) {
            throw new Error(
                data.error ||
                    `AI request failed with status ${response.status}.`
            );
        }

        if (!data.message) {
            throw new Error("The AI returned an empty response.");
        }

        const assistantMessage: ChatMessage = {
            id: Date.now() + 1,
            role: "assistant",
            text: data.message,
        };

        setMessages((current) => [...current, assistantMessage]);
    } catch (error) {
        console.error("AI chat error:", error);

        setMessages((current) => [
            ...current,
            {
                id: Date.now() + 1,
                role: "assistant",
                text:
                    error instanceof Error
                        ? error.message
                        : "I'm sorry, but I couldn't connect to the health information assistant right now. Please try again shortly or contact the clinic directly.",
            },
        ]);
    } finally {
        setSending(false);
    }
};

    return (
        <>
            {/* AI CHAT WINDOW */}
            {chatOpen && (
                <div className="fixed bottom-24 right-4 z-50 w-[calc(100vw-2rem)] max-w-[390px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20 sm:right-5">
                    {/* HEADER */}
                    <div className="bg-[#12323d] px-5 py-4 text-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="grid h-10 w-10 place-items-center rounded-xl bg-teal-400/15 text-teal-300">
                                    <Sparkles size={19} />
                                </div>

                                <div>
                                    <p className="font-bold">Health Assistant</p>
                                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-300">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                        General information
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setChatOpen(false)}
                                className="grid h-9 w-9 place-items-center rounded-full text-slate-300 transition hover:bg-white/10 hover:text-white"
                                aria-label="Close AI chat"
                            >
                                <X size={19} />
                            </button>
                        </div>
                    </div>

                    {/* MESSAGES */}
                    <div className="h-[350px] overflow-y-auto bg-[#f8fbfb] px-4 py-5">
                        <div className="mb-4 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5 text-[11px] leading-5 text-slate-600">
                            This assistant provides general health information only. It
                            cannot diagnose medical conditions or provide emergency advice.
                        </div>

                        <div className="space-y-4">
                            {messages.map((chatMessage) => {
                                const isUser = chatMessage.role === "user";

                                return (
                                    <div
                                        key={chatMessage.id}
                                        className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"
                                            }`}
                                    >
                                        {!isUser && (
                                            <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-teal-50 text-teal-700">
                                                <Bot size={14} />
                                            </div>
                                        )}

                                        <div
                                            className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-6 ${isUser
                                                ? "rounded-br-md bg-teal-700 text-white"
                                                : "rounded-bl-md border border-slate-200 bg-white text-slate-700 shadow-sm"
                                                }`}
                                        >
                                            {chatMessage.text}
                                        </div>

                                        {isUser && (
                                            <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-200 text-slate-600">
                                                <User size={14} />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {sending && (
                                <div className="flex items-end gap-2">
                                    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-teal-50 text-teal-700">
                                        <Bot size={14} />
                                    </div>

                                    <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 shadow-sm">
                                        <div className="flex items-center gap-1">
                                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                                            <span
                                                className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
                                                style={{ animationDelay: "100ms" }}
                                            />
                                            <span
                                                className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
                                                style={{ animationDelay: "200ms" }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* INPUT */}
                    <form
                        onSubmit={sendMessage}
                        className="border-t border-slate-100 bg-white p-3"
                    >
                        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1.5 transition focus-within:border-teal-300 focus-within:ring-2 focus-within:ring-teal-50">
                            <input
                                type="text"
                                value={message}
                                onChange={(event) => setMessage(event.target.value)}
                                placeholder="Ask a health question..."
                                disabled={sending}
                                className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 disabled:opacity-60"
                            />

                            <button
                                type="submit"
                                disabled={!message.trim() || sending}
                                className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-teal-700 text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-40"
                                aria-label="Send message"
                            >
                                {sending ? (
                                    <Loader2 size={17} className="animate-spin" />
                                ) : (
                                    <Send size={17} />
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* FLOATING ACTION BUTTONS */}
            <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2.5">
                {/* Facebook Messenger */}
                <ActionButton
                    href="https://m.me/internisy"
                    label="Message on Facebook"
                    className="bg-[#1877F2] text-white hover:bg-[#166fe5]"
                >
                    <Facebook size={19} fill="currentColor" />
                </ActionButton>

                {/* WhatsApp */}
                <ActionButton
                    href={`https://wa.me/${WHATSAPP}`}
                    label="WhatsApp"
                    className="bg-emerald-500 text-white hover:bg-emerald-600"
                >
                    <MessageCircle size={19} />
                </ActionButton>

                {/* Phone */}
                <ActionButton
                    href={`tel:${PHONE}`}
                    label="Call +977 9804032442"
                    className="bg-white text-teal-700 ring-1 ring-slate-200 hover:bg-teal-50"
                >
                    <Phone size={19} />
                </ActionButton>

                {/* Appointment */}
                <Link
                    href="/appointment"
                    className="group relative grid h-12 w-12 place-items-center rounded-full bg-teal-700 text-white shadow-xl shadow-teal-900/20 transition duration-200 hover:scale-105 hover:bg-teal-800"
                    aria-label="Book appointment"
                >
                    <CalendarDays size={19} />

                    <Tooltip>Book appointment</Tooltip>
                </Link>

                {/* AI */}
                <button
                    type="button"
                    onClick={() => setChatOpen((current) => !current)}
                    className={`group relative grid h-14 w-14 place-items-center rounded-full text-white shadow-xl shadow-slate-900/20 transition duration-200 hover:scale-105 ${chatOpen
                        ? "bg-slate-800 hover:bg-slate-900"
                        : "bg-[#12323d] hover:bg-[#0d2932]"
                        }`}
                    aria-label={chatOpen ? "Close AI chat" : "Open AI chat"}
                >
                    {chatOpen ? <X size={21} /> : <Sparkles size={21} />}

                    <Tooltip>
                        {chatOpen ? "Close assistant" : "Ask AI assistant"}
                    </Tooltip>
                </button>
            </div>
        </>
    );
}

function ActionButton({
    href,
    label,
    className,
    children,
}: {
    href: string;
    label: string;
    className: string;
    children: React.ReactNode;
}) {
    return (
        <a
            href={href}
            target={href.startsWith("http") ? "_blank" : undefined}
            rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
            className={`group relative grid h-12 w-12 place-items-center rounded-full shadow-xl shadow-slate-900/10 transition duration-200 hover:scale-105 ${className}`}
            aria-label={label}
        >
            {children}

            <Tooltip>{label}</Tooltip>
        </a>
    );
}

function Tooltip({ children }: { children: React.ReactNode }) {
    return (
        <span className="pointer-events-none absolute right-14 top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 sm:block">
            {children}
        </span>
    );
}
