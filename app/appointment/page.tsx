"use client";

import {
    FormEvent,
    useEffect,
    useState,
} from "react";

import PageHero from "../../components/PageHero";

import {
    CalendarDays,
    Phone,
    MessageCircle,
    CheckCircle2,
    AlertCircle,
    Clock3,
} from "lucide-react";

const COOLDOWN_SECONDS = 15 * 60;
const COOLDOWN_STORAGE_KEY = "appointment_cooldown_until";

type FormData = {
    name: string;
    age: string;
    gender: string;
    phone: string;
    email: string;
    date: string;
    description: string;
};

export default function Appointment() {
    const [sent, setSent] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");
    const [cooldown, setCooldown] = useState(0);

    const [formData, setFormData] = useState<FormData>({
        name: "",
        age: "",
        gender: "",
        phone: "",
        email: "",
        date: "",
        description: "",
    });

    // --------------------------------------------------
    // Restore cooldown after refresh
    // --------------------------------------------------

    useEffect(() => {
        const storedUntil = localStorage.getItem(
            COOLDOWN_STORAGE_KEY
        );

        if (!storedUntil) return;

        const until = Number(storedUntil);

        if (!Number.isFinite(until)) {
            localStorage.removeItem(COOLDOWN_STORAGE_KEY);
            return;
        }

        const remaining = Math.max(
            0,
            Math.ceil((until - Date.now()) / 1000)
        );

        if (remaining > 0) {
            setCooldown(remaining);
        } else {
            localStorage.removeItem(
                COOLDOWN_STORAGE_KEY
            );
        }
    }, []);

    // --------------------------------------------------
    // Countdown
    // --------------------------------------------------

    useEffect(() => {
        if (cooldown <= 0) return;

        const timer = window.setInterval(() => {
            setCooldown((current) => {
                if (current <= 1) {
                    localStorage.removeItem(
                        COOLDOWN_STORAGE_KEY
                    );

                    window.clearInterval(timer);

                    return 0;
                }

                return current - 1;
            });
        }, 1000);

        return () => window.clearInterval(timer);
    }, [cooldown]);

    function updateField(
        field: keyof FormData,
        value: string
    ) {
        setFormData((current) => ({
            ...current,
            [field]: value,
        }));
    }

    function formatRemainingTime(seconds: number) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        return `${minutes}:${remainingSeconds
            .toString()
            .padStart(2, "0")}`;
    }

    async function submit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        if (sending || cooldown > 0) return;

        setSending(true);
        setSent(false);
        setError("");

        try {
            const response = await fetch(
                "/api/appointment",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify(formData),
                }
            );

            const rawResponse =
                await response.text();

            let data: {
                success?: boolean;
                message?: string;
                cooldown?: boolean;
                remainingSeconds?: number;
            } = {};

            if (rawResponse) {
                try {
                    data = JSON.parse(
                        rawResponse
                    );
                } catch {
                    throw new Error(
                        "The server returned an invalid response."
                    );
                }
            }

            if (!response.ok) {
                if (
                    data.cooldown &&
                    data.remainingSeconds
                ) {
                    const remaining =
                        data.remainingSeconds;

                    setCooldown(remaining);

                    localStorage.setItem(
                        COOLDOWN_STORAGE_KEY,
                        String(
                            Date.now() +
                                remaining * 1000
                        )
                    );
                }

                throw new Error(
                    data.message ||
                        "Unable to submit the appointment request."
                );
            }

            // --------------------------------------------------
            // Successful submission
            // --------------------------------------------------

            setSent(true);

            const cooldownUntil =
                Date.now() +
                COOLDOWN_SECONDS * 1000;

            localStorage.setItem(
                COOLDOWN_STORAGE_KEY,
                String(cooldownUntil)
            );

            setCooldown(COOLDOWN_SECONDS);

            setFormData({
                name: "",
                age: "",
                gender: "",
                phone: "",
                email: "",
                date: "",
                description: "",
            });
        } catch (error) {
            console.error(
                "Appointment submission error:",
                error
            );

            setError(
                error instanceof Error
                    ? error.message
                    : "Something went wrong. Please try again."
            );
        } finally {
            setSending(false);
        }
    }

    const isBlocked =
        sending || cooldown > 0;

    return (
        <>
            <PageHero
                eyebrow="Appointment"
                title="Request a consultation."
                desc="Share a few details below. The clinic team can confirm the actual appointment time after reviewing your request."
            />

            <section className="container py-16">
                <div className="grid gap-10 lg:grid-cols-[1fr_.4fr]">

                    <form
                        onSubmit={submit}
                        className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-xl md:p-9"
                    >
                        <div className="grid gap-5 md:grid-cols-2">

                            <Field
                                label="Full name"
                                name="name"
                                required
                                value={formData.name}
                                onChange={(value) =>
                                    updateField(
                                        "name",
                                        value
                                    )
                                }
                            />

                            <Field
                                label="Age"
                                name="age"
                                type="number"
                                min="0"
                                required
                                value={formData.age}
                                onChange={(value) =>
                                    updateField(
                                        "age",
                                        value
                                    )
                                }
                            />

                            <Select
                                label="Gender"
                                name="gender"
                                options={[
                                    "Female",
                                    "Male",
                                    "Other",
                                    "Prefer not to say",
                                ]}
                                required
                                value={
                                    formData.gender
                                }
                                onChange={(value) =>
                                    updateField(
                                        "gender",
                                        value
                                    )
                                }
                            />

                            <Field
                                label="Phone number"
                                name="phone"
                                type="tel"
                                required
                                value={
                                    formData.phone
                                }
                                onChange={(value) =>
                                    updateField(
                                        "phone",
                                        value
                                    )
                                }
                            />

                            <Field
                                label="Email (optional)"
                                name="email"
                                type="email"
                                value={
                                    formData.email
                                }
                                onChange={(value) =>
                                    updateField(
                                        "email",
                                        value
                                    )
                                }
                            />

                            <Field
                                label="Preferred date"
                                name="date"
                                type="date"
                                required
                                value={formData.date}
                                onChange={(value) =>
                                    updateField(
                                        "date",
                                        value
                                    )
                                }
                            />
                        </div>

                        <label className="mt-5 block text-sm font-bold text-slate-700">
                            Description / reason for visit

                            <textarea
                                name="description"
                                rows={6}
                                value={
                                    formData.description
                                }
                                onChange={(event) =>
                                    updateField(
                                        "description",
                                        event.target.value
                                    )
                                }
                                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-50"
                                placeholder="Tell us briefly about your symptoms, report or reason for consultation..."
                            />
                        </label>

                        {/* Error */}

                        {error && (
                            <div className="mt-5 flex gap-3 rounded-2xl bg-rose-50 p-4 text-sm text-rose-800">
                                <AlertCircle
                                    className="shrink-0"
                                    size={18}
                                />

                                <span>{error}</span>
                            </div>
                        )}

                        {/* Success */}

                        {sent && (
                            <div className="mt-5 flex gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">
                                <CheckCircle2
                                    className="shrink-0"
                                    size={18}
                                />

                                <div>
                                    <p className="font-bold">
                                        Appointment request submitted.
                                    </p>

                                    <p className="mt-1">
                                        Thank you. The clinic
                                        team will review your
                                        request and contact you
                                        to confirm the actual
                                        appointment time.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Cooldown */}

                        {cooldown > 0 && (
                            <div className="mt-5 flex gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
                                <Clock3
                                    className="shrink-0"
                                    size={18}
                                />

                                <div>
                                    <p className="font-bold">
                                        Please wait before
                                        submitting another
                                        request.
                                    </p>

                                    <p className="mt-1">
                                        You can submit another
                                        appointment request in{" "}
                                        <strong>
                                            {formatRemainingTime(
                                                cooldown
                                            )}
                                        </strong>
                                    </p>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isBlocked}
                            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-700 px-6 py-4 font-bold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <CalendarDays size={18} />

                            {sending
                                ? "Sending request..."
                                : cooldown > 0
                                ? `Wait ${formatRemainingTime(
                                      cooldown
                                  )}`
                                : "Submit appointment request"}
                        </button>
                    </form>

                    <aside className="h-fit rounded-[2rem] bg-[#12323d] p-7 text-white lg:sticky lg:top-28">
                        <h2 className="text-2xl font-black">
                            Need a quicker response?
                        </h2>

                        <p className="mt-3 text-sm leading-7 text-slate-300">
                            For urgent appointment
                            enquiries, you can contact
                            the clinic directly by phone
                            or WhatsApp.
                        </p>

                        <div className="mt-7 grid gap-3">

                            <a
                                href="tel:+9779804032442"
                                className="flex items-center gap-3 rounded-2xl bg-white/10 p-4 font-bold"
                            >
                                <Phone size={19} />
                                Call clinic
                            </a>

                            <a
                                href="https://wa.me/9779804032442"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 rounded-2xl bg-emerald-500 p-4 font-bold"
                            >
                                <MessageCircle
                                    size={19}
                                />
                                WhatsApp
                            </a>

                        </div>

                        <div className="mt-8 border-t border-white/10 pt-7 text-sm text-slate-300">
                            <b className="text-white">
                                Location
                            </b>

                            <p className="mt-2">
                                Nobel Medical College
                                Teaching Hospital
                                <br />
                                Biratnagar, Nepal
                            </p>
                        </div>
                    </aside>
                </div>
            </section>
        </>
    );
}

function Field({
    label,
    name,
    type = "text",
    required = false,
    min,
    value,
    onChange,
}: {
    label: string;
    name: string;
    type?: string;
    required?: boolean;
    min?: string;
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <label className="block text-sm font-bold text-slate-700">
            {label}

            {required && (
                <span className="text-rose-500">
                    {" "}
                    *
                </span>
            )}

            <input
                name={name}
                type={type}
                min={min}
                required={required}
                value={value}
                onChange={(event) =>
                    onChange(event.target.value)
                }
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-50"
            />
        </label>
    );
}

function Select({
    label,
    name,
    options,
    required = false,
    value,
    onChange,
}: {
    label: string;
    name: string;
    options: string[];
    required?: boolean;
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <label className="block text-sm font-bold text-slate-700">
            {label}

            {required && (
                <span className="text-rose-500">
                    {" "}
                    *
                </span>
            )}

            <select
                name={name}
                required={required}
                value={value}
                onChange={(event) =>
                    onChange(event.target.value)
                }
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50"
            >
                <option value="">
                    Select
                </option>

                {options.map((option) => (
                    <option
                        key={option}
                        value={option}
                    >
                        {option}
                    </option>
                ))}
            </select>
        </label>
    );
}