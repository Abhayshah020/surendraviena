import { NextRequest, NextResponse } from "next/server";

const BREVO_URL = "https://api.brevo.com/v3/smtp/email";

type AppointmentRequest = {
    name?: string;
    age?: string;
    gender?: string;
    phone?: string;
    email?: string;
    date?: string;
    description?: string;
};

function clean(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Escape user input before putting it inside HTML email.
 */
function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatDate(date: string): string {
    if (!date) return "Not provided";

    const parsed = new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsed.getTime())) {
        return date;
    }

    return parsed.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

export async function POST(request: NextRequest) {
    try {
        // --------------------------------------------------
        // 15-minute server-side cooldown
        // --------------------------------------------------

        const cooldownCookie = request.cookies.get(
            "appointment_cooldown"
        );

        if (cooldownCookie?.value) {
            const cooldownUntil = Number(cooldownCookie.value);
            const now = Date.now();

            if (
                Number.isFinite(cooldownUntil) &&
                cooldownUntil > now
            ) {
                const remainingSeconds = Math.ceil(
                    (cooldownUntil - now) / 1000
                );

                const remainingMinutes = Math.ceil(
                    remainingSeconds / 60
                );

                return NextResponse.json(
                    {
                        success: false,
                        cooldown: true,
                        remainingSeconds,
                        message: `Please wait ${remainingMinutes} minute${
                            remainingMinutes === 1 ? "" : "s"
                        } before submitting another appointment request.`,
                    },
                    { status: 429 }
                );
            }
        }

        // --------------------------------------------------
        // Parse request
        // --------------------------------------------------

        let body: AppointmentRequest;

        try {
            body = (await request.json()) as AppointmentRequest;
        } catch {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid request.",
                },
                { status: 400 }
            );
        }

        const name = clean(body.name);
        const age = clean(body.age);
        const gender = clean(body.gender);
        const phone = clean(body.phone);
        const email = clean(body.email).toLowerCase();
        const date = clean(body.date);
        const description = clean(body.description);

        // --------------------------------------------------
        // Validation
        // --------------------------------------------------

        if (name.length < 2 || name.length > 100) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Please enter a valid full name.",
                },
                { status: 400 }
            );
        }

        const ageNumber = Number(age);

        if (
            !age ||
            !Number.isInteger(ageNumber) ||
            ageNumber < 0 ||
            ageNumber > 120
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Please enter a valid age.",
                },
                { status: 400 }
            );
        }

        const validGenders = [
            "Female",
            "Male",
            "Other",
            "Prefer not to say",
        ];

        if (!validGenders.includes(gender)) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Please select a valid gender.",
                },
                { status: 400 }
            );
        }

        if (phone.length < 7 || phone.length > 30) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Please enter a valid phone number.",
                },
                { status: 400 }
            );
        }

        if (email && !isValidEmail(email)) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Please enter a valid email address.",
                },
                { status: 400 }
            );
        }

        if (!date) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Please select a preferred date.",
                },
                { status: 400 }
            );
        }

        if (description.length > 5000) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Description cannot exceed 5000 characters.",
                },
                { status: 400 }
            );
        }

        // --------------------------------------------------
        // Environment variables
        // --------------------------------------------------

        const brevoApiKey = process.env.BREVO_API_KEY;
        const senderEmail = process.env.BREVO_SENDER_EMAIL;
        const senderName =
            process.env.BREVO_SENDER_NAME;

        const recipientEmails = (
            process.env.APPOINTMENT_RECIPIENT_EMAILS || ""
        )
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean);

        const ccEmails = (
            process.env.APPOINTMENT_CC_EMAILS || ""
        )
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean);

        if (
            !brevoApiKey ||
            !senderEmail ||
            recipientEmails.length === 0
        ) {
            console.error(
                "Appointment email environment variables are not configured."
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "The appointment service is temporarily unavailable.",
                },
                { status: 500 }
            );
        }

        // --------------------------------------------------
        // Email content
        // --------------------------------------------------

        const safeName = escapeHtml(name);
        const safeAge = escapeHtml(age);
        const safeGender = escapeHtml(gender);
        const safePhone = escapeHtml(phone);
        const safeEmail = escapeHtml(email || "Not provided");
        const safeDate = escapeHtml(formatDate(date));
        const safeDescription = escapeHtml(
            description || "No description provided."
        ).replace(/\n/g, "<br />");

        const subject =
            `New Appointment Request - ${name}`;

        const htmlContent = `
<div style="
    margin:0;
    padding:40px 15px;
    background:#f1f5f9;
    font-family:Arial,Helvetica,sans-serif;
    color:#334155;
">
    <table
        role="presentation"
        width="100%"
        cellspacing="0"
        cellpadding="0"
        border="0"
        style="max-width:680px;margin:0 auto;"
    >
        <tr>
            <td>

                <table
                    role="presentation"
                    width="100%"
                    cellspacing="0"
                    cellpadding="0"
                    border="0"
                    style="
                        background:#ffffff;
                        border-radius:18px;
                        overflow:hidden;
                        border:1px solid #e2e8f0;
                    "
                >

                    <!-- Header -->

                    <tr>
                        <td style="
                            padding:30px 32px;
                            background:#0f766e;
                            background-image:linear-gradient(
                                135deg,
                                #0f766e 0%,
                                #2563eb 100%
                            );
                        ">
                            <div style="
                                color:#ffffff;
                                font-size:21px;
                                line-height:28px;
                                font-weight:700;
                            ">
                                Dr. Surendra Prasad Sah
                            </div>

                            <div style="
                                margin-top:5px;
                                color:#ccfbf1;
                                font-size:13px;
                                line-height:20px;
                            ">
                                Hematology Specialist
                            </div>
                        </td>
                    </tr>

                    <!-- Title -->

                    <tr>
                        <td style="padding:34px 32px 12px;">

                            <div style="
                                display:inline-block;
                                padding:6px 10px;
                                background:#ecfdf5;
                                border:1px solid #a7f3d0;
                                border-radius:20px;
                                color:#047857;
                                font-size:11px;
                                font-weight:bold;
                                letter-spacing:.8px;
                                text-transform:uppercase;
                            ">
                                New Appointment Request
                            </div>

                            <h1 style="
                                margin:16px 0 8px;
                                color:#0f172a;
                                font-size:26px;
                                line-height:34px;
                            ">
                                A patient has requested a consultation
                            </h1>

                            <p style="
                                margin:0;
                                color:#64748b;
                                font-size:14px;
                                line-height:22px;
                            ">
                                Someone has submitted an appointment
                                request through the website.
                                Please review the information below
                                and contact the patient to confirm
                                the actual appointment time.
                            </p>

                        </td>
                    </tr>

                    <!-- Patient details -->

                    <tr>
                        <td style="padding:24px 32px 10px;">

                            <table
                                role="presentation"
                                width="100%"
                                cellspacing="0"
                                cellpadding="0"
                                border="0"
                                style="
                                    background:#f8fafc;
                                    border:1px solid #e2e8f0;
                                    border-radius:14px;
                                "
                            >

                                <tr>
                                    <td style="
                                        padding:17px 20px;
                                        border-bottom:1px solid #e2e8f0;
                                    ">
                                        <div style="
                                            color:#94a3b8;
                                            font-size:10px;
                                            font-weight:bold;
                                            letter-spacing:1px;
                                            text-transform:uppercase;
                                        ">
                                            Full Name
                                        </div>

                                        <div style="
                                            margin-top:5px;
                                            color:#0f172a;
                                            font-size:16px;
                                            font-weight:600;
                                        ">
                                            ${safeName}
                                        </div>
                                    </td>
                                </tr>

                                <tr>
                                    <td style="
                                        padding:17px 20px;
                                        border-bottom:1px solid #e2e8f0;
                                    ">
                                        <div style="
                                            color:#94a3b8;
                                            font-size:10px;
                                            font-weight:bold;
                                            letter-spacing:1px;
                                            text-transform:uppercase;
                                        ">
                                            Age
                                        </div>

                                        <div style="
                                            margin-top:5px;
                                            color:#0f172a;
                                            font-size:15px;
                                            font-weight:600;
                                        ">
                                            ${safeAge}
                                        </div>
                                    </td>
                                </tr>

                                <tr>
                                    <td style="
                                        padding:17px 20px;
                                        border-bottom:1px solid #e2e8f0;
                                    ">
                                        <div style="
                                            color:#94a3b8;
                                            font-size:10px;
                                            font-weight:bold;
                                            letter-spacing:1px;
                                            text-transform:uppercase;
                                        ">
                                            Gender
                                        </div>

                                        <div style="
                                            margin-top:5px;
                                            color:#0f172a;
                                            font-size:15px;
                                            font-weight:600;
                                        ">
                                            ${safeGender}
                                        </div>
                                    </td>
                                </tr>

                                <tr>
                                    <td style="
                                        padding:17px 20px;
                                        border-bottom:1px solid #e2e8f0;
                                    ">
                                        <div style="
                                            color:#94a3b8;
                                            font-size:10px;
                                            font-weight:bold;
                                            letter-spacing:1px;
                                            text-transform:uppercase;
                                        ">
                                            Phone
                                        </div>

                                        <a
                                            href="tel:${encodeURIComponent(phone)}"
                                            style="
                                                display:block;
                                                margin-top:5px;
                                                color:#0f766e;
                                                font-size:15px;
                                                font-weight:600;
                                                text-decoration:none;
                                            "
                                        >
                                            ${safePhone}
                                        </a>
                                    </td>
                                </tr>

                                <tr>
                                    <td style="
                                        padding:17px 20px;
                                        border-bottom:1px solid #e2e8f0;
                                    ">
                                        <div style="
                                            color:#94a3b8;
                                            font-size:10px;
                                            font-weight:bold;
                                            letter-spacing:1px;
                                            text-transform:uppercase;
                                        ">
                                            Email
                                        </div>

                                        ${
                                            email
                                                ? `
                                            <a
                                                href="mailto:${encodeURIComponent(email)}"
                                                style="
                                                    display:block;
                                                    margin-top:5px;
                                                    color:#0f766e;
                                                    font-size:15px;
                                                    font-weight:600;
                                                    text-decoration:none;
                                                "
                                            >
                                                ${safeEmail}
                                            </a>
                                        `
                                                : `
                                            <div style="
                                                margin-top:5px;
                                                color:#475569;
                                                font-size:15px;
                                            ">
                                                Not provided
                                            </div>
                                        `
                                        }
                                    </td>
                                </tr>

                                <tr>
                                    <td style="padding:17px 20px;">
                                        <div style="
                                            color:#94a3b8;
                                            font-size:10px;
                                            font-weight:bold;
                                            letter-spacing:1px;
                                            text-transform:uppercase;
                                        ">
                                            Preferred Date
                                        </div>

                                        <div style="
                                            margin-top:5px;
                                            color:#0f172a;
                                            font-size:15px;
                                            font-weight:600;
                                        ">
                                            ${safeDate}
                                        </div>
                                    </td>
                                </tr>

                            </table>

                        </td>
                    </tr>

                    <!-- Description -->

                    <tr>
                        <td style="padding:22px 32px 10px;">

                            <div style="
                                color:#64748b;
                                font-size:11px;
                                font-weight:bold;
                                letter-spacing:1px;
                                text-transform:uppercase;
                                margin-bottom:10px;
                            ">
                                Reason for Visit
                            </div>

                            <div style="
                                padding:20px;
                                background:#f0fdfa;
                                border-left:4px solid #0f766e;
                                border-radius:10px;
                                color:#334155;
                                font-size:15px;
                                line-height:25px;
                            ">
                                ${safeDescription}
                            </div>

                        </td>
                    </tr>

                    <!-- Action -->

                    <tr>
                        <td style="padding:28px 32px 34px;">

                            ${
                                email
                                    ? `
                                <a
                                    href="mailto:${encodeURIComponent(email)}"
                                    style="
                                        display:inline-block;
                                        padding:13px 22px;
                                        background:#0f766e;
                                        color:#ffffff;
                                        border-radius:10px;
                                        font-size:14px;
                                        font-weight:bold;
                                        text-decoration:none;
                                    "
                                >
                                    Reply to ${safeName} &rarr;
                                </a>
                            `
                                    : ""
                            }

                        </td>
                    </tr>

                    <!-- Footer -->

                    <tr>
                        <td style="
                            padding:20px 32px;
                            background:#f8fafc;
                            border-top:1px solid #e2e8f0;
                        ">
                            <p style="
                                margin:0;
                                color:#64748b;
                                font-size:12px;
                                line-height:19px;
                            ">
                                This appointment request was submitted
                                through the clinic website.
                            </p>

                            <p style="
                                margin:6px 0 0;
                                color:#94a3b8;
                                font-size:11px;
                            ">
                                Nobel Medical College Teaching Hospital
                                <br />
                                Biratnagar, Nepal
                            </p>
                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>
</div>
`;

        const textContent = `
New Appointment Request

Full Name:
${name}

Age:
${age}

Gender:
${gender}

Phone:
${phone}

Email:
${email || "Not provided"}

Preferred Date:
${formatDate(date)}

Reason for Visit:
${description || "No description provided."}
        `.trim();

        // --------------------------------------------------
        // Brevo
        // --------------------------------------------------

        const brevoPayload = {
            sender: {
                name: senderName,
                email: senderEmail,
            },

            to: recipientEmails.map((recipient) => ({
                email: recipient,
            })),

            ...(ccEmails.length > 0
                ? {
                      cc: ccEmails.map((recipient) => ({
                          email: recipient,
                      })),
                  }
                : {}),

            ...(email
                ? {
                      replyTo: {
                          email,
                          name,
                      },
                  }
                : {}),

            subject,
            htmlContent,
            textContent,

            tags: [
                "appointment-form",
                "hematology-website",
                "consultation-request",
            ],
        };

        const brevoResponse = await fetch(BREVO_URL, {
            method: "POST",

            headers: {
                accept: "application/json",
                "api-key": brevoApiKey,
                "Content-Type": "application/json",
            },

            body: JSON.stringify(brevoPayload),
        });

        const brevoText = await brevoResponse.text();

        if (!brevoResponse.ok) {
            console.error(
                "Brevo appointment API error:",
                brevoResponse.status,
                brevoText
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "We couldn't send your appointment request right now. Please try again later or contact the clinic directly.",
                },
                { status: 502 }
            );
        }

        // --------------------------------------------------
        // Set 15-minute cooldown ONLY after successful email
        // --------------------------------------------------

        const cooldownUntil =
            Date.now() + 15 * 60 * 1000;

        const response = NextResponse.json(
            {
                success: true,
                message:
                    "Your appointment request has been submitted successfully.",
                cooldownSeconds: 15 * 60,
            },
            { status: 200 }
        );

        response.cookies.set(
            "appointment_cooldown",
            String(cooldownUntil),
            {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 15 * 60,
                path: "/",
            }
        );

        return response;
    } catch (error) {
        console.error("Appointment API error:", error);

        return NextResponse.json(
            {
                success: false,
                message:
                    "Something went wrong while sending your appointment request.",
            },
            { status: 500 }
        );
    }
}