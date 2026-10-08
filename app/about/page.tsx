import Image from 'next/image';
import Link from 'next/link';
import PageHero from '../../components/PageHero';
import {
    ArrowRight,
    GraduationCap,
    HeartHandshake,
    Hospital,
    MapPin,
    Stethoscope,
    Quote,
} from 'lucide-react';

export default function About() {
    return (
        <>
            <PageHero
                eyebrow="About Dr. Surendra Prasad Sah"
                title="A journey shaped by medicine, hematology and patient care."
                desc="Dr. Surendra Prasad Sah is a hematology-focused physician serving patients in Biratnagar. His work is centered around understanding blood-related conditions and helping patients navigate their care with clarity and compassion."
            />

            {/* Doctor introduction */}
            <section className="bg-white">
                <div className="container py-16 md:py-24">
                    <div className="grid items-center gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
                        {/* Image */}
                        <div className="relative">
                            <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-teal-100 via-blue-50 to-transparent" />

                            <div className="relative overflow-hidden rounded-[2rem] bg-slate-100 shadow-xl shadow-slate-900/10">
                                <Image
                                    src="/profilePicture.jpg"
                                    alt="Dr. Surendra Prasad Sah"
                                    width={900}
                                    height={1100}
                                    className="h-[560px] w-full object-cover object-top"
                                    priority
                                />
                            </div>

                            <div className="absolute -bottom-5 left-5 right-5 rounded-2xl border border-white/70 bg-white/95 p-5 shadow-xl backdrop-blur md:left-8 md:right-8">
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-600">
                                    Hematology
                                </p>

                                <h2 className="mt-1 text-xl font-black text-slate-900">
                                    Dr. Surendra Prasad Sah
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Nobel Medical College Teaching Hospital
                                </p>
                            </div>
                        </div>

                        {/* Introduction */}
                        <div className="pt-5 lg:pt-0">
                            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-teal-700">
                                <Stethoscope size={15} />
                                Doctor profile
                            </div>

                            <h2 className="max-w-2xl text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
                                Medicine is not only about treating a condition.
                                It is about understanding the person behind it.
                            </h2>

                            <div className="mt-6 space-y-5 text-base leading-8 text-slate-600">
                                <p>
                                    Dr. Surendra Prasad Sah has developed his
                                    professional focus around hematology and the
                                    evaluation of conditions affecting the blood
                                    and related systems.
                                </p>

                                <p>
                                    For patients, a hematology consultation can
                                    involve understanding blood reports,
                                    investigating unexplained symptoms, assessing
                                    abnormal blood counts and determining what
                                    further evaluation may be appropriate.
                                </p>

                                <p>
                                    His approach is centered on making these
                                    conversations easier to understand while
                                    keeping clinical decision-making grounded in
                                    the patient's individual history and medical
                                    findings.
                                </p>
                            </div>

                            <div className="mt-8 flex flex-wrap gap-3">
                                <Link
                                    href="/appointment"
                                    className="inline-flex items-center gap-2 rounded-full bg-teal-700 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-teal-700/15 transition hover:bg-teal-800"
                                >
                                    Book an appointment
                                    <ArrowRight size={16} />
                                </Link>

                                <Link
                                    href="/diseases"
                                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:border-teal-200 hover:text-teal-700"
                                >
                                    Explore hematology
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Journey */}
            <section className="bg-slate-50/70">
                <div className="container py-20 md:py-24">
                    <div className="mx-auto max-w-6xl">
                        <div className="max-w-2xl">
                            <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-600">
                                Professional journey
                            </p>

                            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
                                A career built around learning and patient care.
                            </h2>

                            <p className="mt-4 leading-7 text-slate-600">
                                Every medical career is a continuing journey.
                                From medical education to clinical practice,
                                specialization and the experience gained from
                                caring for patients, each stage contributes to
                                becoming a better physician.
                            </p>
                        </div>

                        <div className="mt-14 grid gap-6 md:grid-cols-3">
                            <JourneyCard
                                number="01"
                                icon={<GraduationCap size={22} />}
                                title="Medical foundation"
                                text="The journey begins with medical education and the development of a strong foundation in understanding the human body, disease and clinical decision-making."
                            />

                            <JourneyCard
                                number="02"
                                icon={<Stethoscope size={22} />}
                                title="Growing clinical focus"
                                text="Clinical experience brings together medical knowledge and the practical responsibility of listening to patients, evaluating findings and approaching complex health concerns."
                            />

                            <JourneyCard
                                number="03"
                                icon={<HeartHandshake size={22} />}
                                title="Hematology & patient care"
                                text="A focus on hematology brings particular attention to blood disorders, diagnostic evaluation and helping patients understand the next steps in their care."
                            />
                        </div>

                        <div className="mt-10 rounded-[2rem] border border-teal-100 bg-white p-7 shadow-sm md:p-10">
                            <div className="flex flex-col gap-6 md:flex-row md:items-start">
                                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-teal-50 text-teal-600">
                                    <Quote size={22} />
                                </div>

                                <div>
                                    <p className="text-xl font-bold leading-8 text-slate-800 md:text-2xl">
                                        “Good medical care begins with listening,
                                        understanding and giving patients the
                                        information they need to move forward.”
                                    </p>

                                    <p className="mt-4 text-sm font-semibold text-teal-700">
                                        — Dr. Surendra Prasad Sah
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Practice */}
            <section className="bg-white">
                <div className="container py-20 md:py-24">
                    <div className="mx-auto max-w-6xl">
                        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
                            <InfoCard
                                icon={<HeartHandshake size={22} />}
                                eyebrow="Patient experience"
                                title="Clear communication matters."
                                text="Blood-related conditions can be confusing, especially when patients encounter unfamiliar test names or unexpected results. A patient-focused consultation aims to make medical information easier to understand."
                            />

                            <InfoCard
                                icon={<Hospital size={22} />}
                                eyebrow="Clinical setting"
                                title="Care in Biratnagar."
                                text="Dr. Surendra Prasad Sah is associated with Nobel Medical College Teaching Hospital in Biratnagar, providing a clinical setting for evaluation and specialist care."
                            />

                            <InfoCard
                                icon={<MapPin size={22} />}
                                eyebrow="Where to find us"
                                title="Biratnagar, Koshi Province."
                                text="The practice is based at Nobel Medical College Teaching Hospital in Biratnagar, Nepal."
                            />

                            <InfoCard
                                icon={<GraduationCap size={22} />}
                                eyebrow="Professional development"
                                title="Medicine is a lifelong journey."
                                text="Medical practice continues to evolve through clinical experience, continuing education and a commitment to keeping patient care at the center of every consultation."
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Hospital */}
            <section className="bg-gradient-to-br from-teal-50 via-white to-blue-50">
                <div className="container py-20 md:py-24">
                    <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
                        <div>
                            <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-600">
                                Clinical setting
                            </p>

                            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
                                Nobel Medical College Teaching Hospital
                            </h2>

                            <p className="mt-5 leading-8 text-slate-600">
                                Nobel Medical College Teaching Hospital is located
                                in Biratnagar and provides a broad clinical
                                environment for medical education, diagnosis and
                                patient care.
                            </p>

                            <p className="mt-4 leading-8 text-slate-600">
                                For patients seeking hematology care, the hospital
                                provides the wider clinical setting in which
                                specialist consultation and diagnostic evaluation
                                can take place.
                            </p>

                            <a
                                href="https://www.nobelmedicalcollege.com.np/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-7 inline-flex items-center gap-2 rounded-full bg-teal-700 px-6 py-3 text-sm font-bold text-white transition hover:bg-teal-800"
                            >
                                Visit hospital website
                                <ArrowRight size={16} />
                            </a>
                        </div>

                        <div className="rounded-[2rem] border border-white/80 bg-white/80 p-7 shadow-xl shadow-teal-900/5 backdrop-blur">
                            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-700">
                                <Hospital size={23} />
                            </div>

                            <h3 className="mt-6 text-xl font-black text-slate-900">
                                Location
                            </h3>

                            <p className="mt-2 leading-7 text-slate-600">
                                Nobel Medical College Teaching Hospital
                                <br />
                                Biratnagar, Koshi Province
                                <br />
                                Nepal
                            </p>

                            <a
                                href="https://maps.google.com/?q=Nobel+Medical+College+Teaching+Hospital+Biratnagar"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-teal-700 hover:text-teal-800"
                            >
                                View on map
                                <ArrowRight size={15} />
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="bg-white">
                <div className="container py-16 md:py-20">
                    <div className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-[#12323d] px-7 py-10 text-white shadow-xl md:px-12 md:py-12">
                        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
                            <div className="max-w-2xl">
                                <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-300">
                                    Start with a conversation
                                </p>

                                <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
                                    Have questions about your blood health?
                                </h2>

                                <p className="mt-4 leading-7 text-slate-300">
                                    Schedule a consultation to discuss your
                                    symptoms, concerns and medical history with
                                    a hematology-focused physician.
                                </p>
                            </div>

                            <Link
                                href="/appointment"
                                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-[#12323d] transition hover:bg-teal-50"
                            >
                                Book appointment
                                <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>

                    <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-6 text-slate-400">
                        Information on this page is intended for general
                        educational purposes. Professional credentials,
                        qualifications and other career details should be
                        confirmed through official sources or the clinic.
                    </p>
                </div>
            </section>
        </>
    );
}

function JourneyCard({
    number,
    icon,
    title,
    text,
}: {
    number: string;
    icon: React.ReactNode;
    title: string;
    text: string;
}) {
    return (
        <article className="group rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-teal-200 hover:shadow-xl hover:shadow-teal-900/5">
            <div className="flex items-center justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-600">
                    {icon}
                </div>

                <span className="text-5xl font-black text-teal-50 transition group-hover:text-teal-100">
                    {number}
                </span>
            </div>

            <h3 className="mt-7 text-xl font-extrabold text-slate-900">
                {title}
            </h3>

            <p className="mt-3 text-sm leading-7 text-slate-600">
                {text}
            </p>
        </article>
    );
}

function InfoCard({
    icon,
    eyebrow,
    title,
    text,
}: {
    icon: React.ReactNode;
    eyebrow: string;
    title: string;
    text: string;
}) {
    return (
        <article className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-teal-200 hover:shadow-lg">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-700">
                {icon}
            </div>

            <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-teal-600">
                {eyebrow}
            </p>

            <h3 className="mt-2 text-xl font-black text-slate-900">
                {title}
            </h3>

            <p className="mt-3 text-sm leading-7 text-slate-600">
                {text}
            </p>
        </article>
    );
}