import Link from "next/link";
import {
    ArrowRight,
    CheckCircle2,
    HeartPulse,
    Microscope,
    ShieldCheck,
    Stethoscope,
    MapPin,
    Sparkles,
    CalendarDays,
    GraduationCap,
    Activity,
} from "lucide-react";

export default function Home() {
    return (
        <main className="bg-white text-slate-900">
            {/* HERO */}
            <section className="relative overflow-hidden bg-[#f6fbfa]">
                <div className="absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-teal-100/40 blur-3xl" />
                <div className="absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-blue-100/30 blur-3xl" />

                <div className="container relative grid min-h-[760px] items-center gap-14 py-16 lg:grid-cols-[1fr_0.82fr] lg:py-20">
                    {/* LEFT */}
                    <div className="max-w-3xl">
                        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-teal-100 bg-white px-4 py-2 text-sm font-semibold text-teal-800 shadow-sm">
                            <span className="h-2 w-2 rounded-full bg-teal-600" />
                            Hematology Specialist · Biratnagar, Nepal
                        </div>

                        <p className="text-sm font-bold uppercase tracking-[0.2em] text-teal-700">
                            Dr. Surendra Prasad Sah
                        </p>

                        <h1 className="mt-4 max-w-3xl text-5xl font-semibold leading-[1.05] tracking-[-0.04em] text-slate-950 md:text-6xl lg:text-7xl">
                            Specialist care for{" "}
                            <span className="text-teal-700">blood health.</span>
                        </h1>

                        <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600">
                            Compassionate, evidence-based hematology care with a focus on
                            understanding your diagnosis, explaining your options clearly,
                            and planning the right next step.
                        </p>

                        <div className="mt-9 flex flex-wrap gap-3">
                            <Link
                                href="/appointment"
                                className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-teal-700/15 transition hover:bg-teal-800"
                            >
                                <CalendarDays size={18} />
                                Book an appointment
                                <ArrowRight size={17} />
                            </Link>

                            <Link
                                href="/about"
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-4 text-sm font-bold text-slate-800 transition hover:border-teal-200 hover:bg-teal-50"
                            >
                                Meet the doctor
                            </Link>
                        </div>

                        {/* CREDENTIALS */}
                        <div className="mt-12 grid max-w-2xl gap-4 border-t border-slate-200 pt-7 sm:grid-cols-3">
                            <div className="flex items-start gap-3">
                                <div className="rounded-lg bg-teal-50 p-2 text-teal-700">
                                    <Stethoscope size={19} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900">
                                        Hematology
                                    </p>
                                    <p className="mt-1 text-xs leading-5 text-slate-500">
                                        Specialist consultation
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="rounded-lg bg-teal-50 p-2 text-teal-700">
                                    <GraduationCap size={19} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900">
                                        Specialist care
                                    </p>
                                    <p className="mt-1 text-xs leading-5 text-slate-500">
                                        Diagnosis & treatment
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="rounded-lg bg-teal-50 p-2 text-teal-700">
                                    <HeartPulse size={19} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900">
                                        Patient focused
                                    </p>
                                    <p className="mt-1 text-xs leading-5 text-slate-500">
                                        Clear, compassionate care
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* DOCTOR IMAGE */}
                    <div className="relative mx-auto w-full max-w-[500px] lg:ml-auto">
                        <div className="absolute -inset-5 rounded-[3rem] bg-teal-100/70 blur-2xl" />

                        <div className="relative overflow-hidden rounded-[2rem] bg-white p-3 shadow-[0_25px_70px_rgba(15,118,110,0.12)] ring-1 ring-slate-200">
                            <div className="relative overflow-hidden rounded-[1.5rem] bg-slate-100">
                                <img
                                    src="/profilePicture.jpg"
                                    alt="Dr. Surendra Prasad Sah"
                                    className="h-[580px] w-full object-cover object-center"
                                />

                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent p-6 pt-24">
                                    <div className="rounded-2xl border border-white/20 bg-white/90 p-4 shadow-xl backdrop-blur-md">
                                        <p className="text-xs font-bold uppercase tracking-[0.15em] text-teal-700">
                                            Hematology Specialist
                                        </p>

                                        <h2 className="mt-1 text-lg font-bold text-slate-900">
                                            Dr. Surendra Prasad Sah
                                        </h2>

                                        <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
                                            <MapPin size={14} className="text-teal-700" />
                                            Nobel Medical College Teaching Hospital
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* FLOATING BADGE */}
                        <div className="absolute -left-5 top-12 hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-xl sm:block">
                            <div className="flex items-center gap-3">
                                <div className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-700">
                                    <Activity size={19} />
                                </div>

                                <div>
                                    <p className="text-xs font-semibold text-slate-500">
                                        Focused specialty
                                    </p>
                                    <p className="text-sm font-bold text-slate-900">
                                        Blood disorders
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* INTRODUCTION */}
            <section className="border-b border-slate-100 bg-white">
                <div className="container py-20 lg:py-24">
                    <div className="mx-auto max-w-3xl text-center">
                        <span className="text-xs font-bold uppercase tracking-[0.22em] text-teal-700">
                            A clearer approach to hematology
                        </span>

                        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                            Understanding your health is part of your care.
                        </h2>

                        <p className="mt-5 text-base leading-8 text-slate-600 md:text-lg">
                            Blood-related conditions can be complex. Your consultation
                            should not be. Explore reliable information about common
                            conditions, diagnostic procedures and treatment approaches before
                            your visit.
                        </p>
                    </div>

                    <div className="mt-14 grid gap-5 md:grid-cols-3">
                        <Feature
                            icon={<Microscope size={22} />}
                            number="01"
                            title="Understand the cause"
                            text="Learn how blood counts, symptoms and diagnostic tests can help identify the underlying condition."
                        />

                        <Feature
                            icon={<ShieldCheck size={22} />}
                            number="02"
                            title="Personalised care"
                            text="Treatment decisions depend on the diagnosis, severity, test results and individual patient needs."
                        />

                        <Feature
                            icon={<Stethoscope size={22} />}
                            number="03"
                            title="Plan your visit"
                            text="Bring previous reports, prescriptions and relevant medical information to make your consultation more productive."
                        />
                    </div>
                </div>
            </section>

            {/* SERVICES / EXPLORE */}
            <section className="bg-[#f6fbfa] py-20 lg:py-24">
                <div className="container">
                    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
                        <div className="max-w-2xl">
                            <span className="text-xs font-bold uppercase tracking-[0.22em] text-teal-700">
                                Hematology information
                            </span>

                            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                                From your report to your next step.
                            </h2>

                            <p className="mt-4 leading-7 text-slate-600">
                                Explore the website to learn about conditions, procedures and
                                treatment approaches commonly encountered in hematology.
                            </p>
                        </div>

                        <Link
                            href="/diseases"
                            className="inline-flex items-center gap-2 text-sm font-bold text-teal-700 hover:text-teal-800"
                        >
                            Explore all information
                            <ArrowRight size={17} />
                        </Link>
                    </div>

                    <div className="mt-12 grid gap-5 lg:grid-cols-3">
                        <MedicalCard
                            href="/diseases"
                            number="01"
                            title="Diseases & conditions"
                            text="Learn about anemia, platelet disorders, leukemia, lymphoma and other blood-related conditions."
                        />

                        <MedicalCard
                            href="/procedures"
                            number="02"
                            title="Procedures"
                            text="Understand common investigations and diagnostic procedures used in evaluating blood disorders."
                        />

                        <MedicalCard
                            href="/treatments"
                            number="03"
                            title="Treatments"
                            text="Explore general treatment categories and how treatment decisions may differ between conditions."
                        />
                    </div>

                    <p className="mt-7 text-xs leading-6 text-slate-500">
                        Educational information only. Content on this website is not a
                        substitute for professional medical diagnosis or treatment.
                    </p>
                </div>
            </section>

            {/* DOCTOR / LOCATION */}
            <section className="bg-white py-20 lg:py-24">
                <div className="container grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-[0.22em] text-teal-700">
                            Your consultation
                        </span>

                        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                            A consultation built around listening, understanding and care.
                        </h2>

                        <p className="mt-5 leading-8 text-slate-600">
                            Your medical history, symptoms and previous investigations all
                            contribute to understanding your condition. Bringing relevant
                            reports and medications can help make your consultation more
                            focused.
                        </p>

                        <div className="mt-8 space-y-5">
                            <InfoRow
                                icon={<CheckCircle2 size={19} />}
                                title="Bring previous reports"
                                text="Blood tests, imaging and previous consultation notes can be useful."
                            />

                            <InfoRow
                                icon={<CheckCircle2 size={19} />}
                                title="Bring your medication list"
                                text="Include current medicines and relevant supplements."
                            />

                            <InfoRow
                                icon={<CheckCircle2 size={19} />}
                                title="Prepare your questions"
                                text="Writing down your concerns can help you make the most of your visit."
                            />
                        </div>

                        <Link
                            href="/appointment"
                            className="mt-9 inline-flex items-center gap-2 rounded-xl bg-teal-700 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-teal-700/10 transition hover:bg-teal-800"
                        >
                            Request an appointment
                            <ArrowRight size={17} />
                        </Link>
                    </div>

                    <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-50 shadow-sm">
                        <div className="border-b border-slate-200 bg-white p-6">
                            <div className="flex items-center gap-3">
                                <div className="grid h-11 w-11 place-items-center rounded-xl bg-teal-50 text-teal-700">
                                    <MapPin size={20} />
                                </div>

                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
                                        Consultation location
                                    </p>
                                    <h3 className="mt-1 font-bold text-slate-900">
                                        Nobel Medical College Teaching Hospital
                                    </h3>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Biratnagar, Koshi Province, Nepal
                                    </p>
                                </div>
                            </div>
                        </div>

                        <iframe
                            title="Nobel Medical College Teaching Hospital map"
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2032.062469958379!2d87.26908701213117!3d26.489643818931505!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39ef7387a53a775b%3A0xdca2ac6e8ff9efd7!2sNobel%20Medical%20College%20Teaching%20Hospital!5e1!3m2!1sen!2snp!4v1791262979563!5m2!1sen!2snp"
                            className="h-[390px] w-full border-0"
                            loading="lazy"
                        />
                    </div>
                </div>
            </section>

            {/* FINAL CARE SECTION */}
            <section className="bg-[#f6fbfa] py-20 lg:py-24">
                <div className="container">
                    <div className="relative overflow-hidden rounded-[2.5rem] bg-[#12323d] px-7 py-14 shadow-xl md:px-12 md:py-16 lg:px-16">
                        {/* Background decoration */}
                        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-teal-400/10 blur-3xl" />
                        <div className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl" />

                        <div className="relative grid items-center gap-12 lg:grid-cols-[1fr_auto]">
                            <div className="max-w-2xl">
                                <div className="flex items-center gap-2 text-teal-300">
                                    <Sparkles size={18} />
                                    <span className="text-xs font-bold uppercase tracking-[0.2em]">
                                        Before your consultation
                                    </span>
                                </div>

                                <h2 className="mt-5 text-3xl font-semibold leading-tight tracking-tight text-white md:text-4xl lg:text-5xl">
                                    Have questions about your{" "}
                                    <span className="text-teal-300">blood health?</span>
                                </h2>

                                <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">
                                    Explore general hematology information or take the next step and
                                    request a consultation with Dr. Surendra Prasad Sah.
                                </p>

                                <p className="mt-4 max-w-xl text-sm leading-6 text-slate-400">
                                    The health information assistant is intended for general
                                    educational purposes only. It does not provide diagnosis,
                                    emergency advice or replace consultation with a qualified doctor.
                                </p>

                                <div className="mt-8 flex flex-wrap gap-3">
                                    <button className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-slate-900 transition hover:bg-teal-50">
                                        <Sparkles size={17} />
                                        Ask a question
                                    </button>

                                    <Link
                                        href="/appointment"
                                        className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/15"
                                    >
                                        Book an appointment
                                        <ArrowRight size={17} />
                                    </Link>
                                </div>
                            </div>

                            {/* Simple clinical information panel */}
                            <div className="hidden w-[270px] shrink-0 lg:block">
                                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-sm">
                                    <div className="grid h-12 w-12 place-items-center rounded-xl bg-teal-400/10 text-teal-300">
                                        <HeartPulse size={22} />
                                    </div>

                                    <h3 className="mt-5 text-lg font-bold text-white">
                                        Specialist hematology care
                                    </h3>

                                    <p className="mt-2 text-sm leading-6 text-slate-400">
                                        Clear information, thoughtful consultation and a patient-focused
                                        approach to blood health.
                                    </p>

                                    <div className="mt-5 flex items-center gap-2 border-t border-white/10 pt-5 text-xs font-semibold text-slate-300">
                                        <MapPin size={14} className="text-teal-300" />
                                        Biratnagar, Nepal
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

        </main>
    );
}

function Feature({
    icon,
    number,
    title,
    text,
}: {
    icon: React.ReactNode;
    number: string;
    title: string;
    text: string;
}) {
    return (
        <div className="group rounded-2xl border border-slate-200 bg-white p-7 transition duration-300 hover:-translate-y-1 hover:border-teal-200 hover:shadow-xl hover:shadow-slate-200/40">
            <div className="flex items-center justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-teal-50 text-teal-700">
                    {icon}
                </div>

                <span className="text-xs font-bold tracking-widest text-slate-300">
                    {number}
                </span>
            </div>

            <h3 className="mt-6 text-xl font-bold text-slate-900">{title}</h3>

            <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
        </div>
    );
}

function MedicalCard({
    href,
    number,
    title,
    text,
}: {
    href: string;
    number: string;
    title: string;
    text: string;
}) {
    return (
        <Link
            href={href}
            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-7 transition duration-300 hover:-translate-y-1 hover:border-teal-200 hover:shadow-xl hover:shadow-slate-200/50"
        >
            <div className="flex items-start justify-between">
                <span className="text-xs font-bold tracking-widest text-teal-700">
                    {number}
                </span>

                <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-50 text-slate-500 transition group-hover:bg-teal-50 group-hover:text-teal-700">
                    <ArrowRight size={17} />
                </div>
            </div>

            <h3 className="mt-10 text-xl font-bold text-slate-900">{title}</h3>

            <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>

            <div className="mt-6 text-sm font-bold text-teal-700">
                Learn more →
            </div>
        </Link>
    );
}

function InfoRow({
    icon,
    title,
    text,
}: {
    icon: React.ReactNode;
    title: string;
    text: string;
}) {
    return (
        <div className="flex gap-4">
            <div className="mt-0.5 shrink-0 text-teal-700">{icon}</div>

            <div>
                <h3 className="text-sm font-bold text-slate-900">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">{text}</p>
            </div>
        </div>
    );
}