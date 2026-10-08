import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const MODEL =
    process.env.GROQ_MODEL || "allam-2-7b";

const SYSTEM_PROMPT = `
You are the official general health information assistant for a hematology
doctor's website in Biratnagar, Nepal.

Your purpose is to provide clear, simple and medically responsible general
information about hematology, blood disorders, symptoms, tests, procedures,
treatments and preparing for a medical consultation.

IMPORTANT RULES:

1. You are NOT a doctor and must never claim to diagnose a patient.

2. Never provide a definitive diagnosis based only on symptoms, laboratory
   values or information provided by the user.

3. Do not tell users to start, stop, increase or decrease prescription
   medication.

4. Do not provide emergency treatment instructions that could delay emergency
   care.

5. If the user describes potentially serious or life-threatening symptoms,
   clearly advise them to seek urgent medical attention or contact emergency
   services.

6. Explain medical terminology in simple language whenever possible.

7. Encourage users to discuss personal medical concerns with a qualified
   doctor.

8. You may explain what common blood tests such as CBC, hemoglobin, platelet
   count, WBC count, iron studies and other hematology investigations generally
   mean, but do not diagnose the user from their results.

9. When discussing a condition, explain:
   - What it generally is
   - Common symptoms
   - Common causes or risk factors
   - How doctors generally investigate it
   - General treatment approaches
   - When medical attention may be appropriate

10. Do not pretend to have access to the user's medical records.

11. Do not claim that you have reviewed medical reports, images or test
    results unless they have actually been provided to you.

12. Keep responses concise and appropriate for a website chat widget.

13. Use a calm, respectful and reassuring tone.

14. Do not create unnecessary fear or alarm.

15. Always make it clear when information is general and when the user should
    speak with a healthcare professional.

This assistant provides educational information only and does not replace
professional medical diagnosis, treatment or emergency care.
`;

export async function POST(request: NextRequest) {
    try {
        if (!process.env.GROQ_API_KEY) {
            console.error("GROQ_API_KEY is not configured.");

            return NextResponse.json(
                {
                    error: "AI service is not configured.",
                },
                { status: 500 }
            );
        }

        let body;

        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                {
                    error: "Invalid request body.",
                },
                { status: 400 }
            );
        }

        const message = body?.message;
        const history = body?.history;

        if (typeof message !== "string") {
            return NextResponse.json(
                {
                    error: "A valid message is required.",
                },
                { status: 400 }
            );
        }

        const trimmedMessage = message.trim();

        if (!trimmedMessage) {
            return NextResponse.json(
                {
                    error: "Message cannot be empty.",
                },
                { status: 400 }
            );
        }

        if (trimmedMessage.length > 4000) {
            return NextResponse.json(
                {
                    error: "Message is too long.",
                },
                { status: 400 }
            );
        }

        const conversationHistory = Array.isArray(history)
            ? history
                .filter(
                    (item) =>
                        item &&
                        (item.role === "user" ||
                            item.role === "assistant") &&
                        typeof item.content === "string"
                )
                .slice(-10)
            : [];

        const completion =
            await groq.chat.completions.create({
                model: MODEL,

                messages: [
                    {
                        role: "system",
                        content: SYSTEM_PROMPT,
                    },

                    ...conversationHistory,

                    {
                        role: "user",
                        content: trimmedMessage,
                    },
                ],

                temperature: 0.2,
                max_completion_tokens: 700,
            });

        const aiResponse =
            completion.choices?.[0]?.message?.content?.trim();

        if (!aiResponse) {
            console.error(
                "Groq returned no message:",
                completion
            );

            return NextResponse.json(
                {
                    error: "The AI returned an empty response.",
                },
                { status: 502 }
            );
        }

        return NextResponse.json({
            message: aiResponse,
        });
    } catch (error) {
        console.error("========== GROQ API ERROR ==========");
        console.error(error);
        console.error("====================================");

        const errorMessage =
            error instanceof Error
                ? error.message
                : "Unknown Groq API error";

        return NextResponse.json(
            {
                error: errorMessage,
            },
            { status: 500 }
        );
    }
}

