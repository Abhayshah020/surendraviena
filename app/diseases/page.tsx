"use client";

import { useState } from "react";
import { diseases } from "../../lib/data";
import PageHero from "../../components/PageHero";
import {
    ArrowRight,
    AlertCircle,
    ChevronDown,
    CheckCircle2,
    Stethoscope,
} from "lucide-react";
import Link from "next/link";

type DiseaseInfo = {
    overview: string;
    symptoms: string[];
    diagnosis: string;
    treatment: string;
    image: string;
};

const diseaseDetails: Record<string, DiseaseInfo> = {
    Anemia: {
        overview:
            "Anemia occurs when the blood does not have enough healthy red blood cells or hemoglobin to carry oxygen effectively around the body. There are many possible causes, including iron deficiency, vitamin deficiencies, blood loss and chronic medical conditions.",
        symptoms: [
            "Tiredness and low energy",
            "Shortness of breath",
            "Pale skin",
            "Dizziness or light-headedness",
            "Fast or irregular heartbeat",
        ],
        diagnosis:
            "Evaluation commonly begins with a complete blood count (CBC). Depending on the findings, additional blood tests may be recommended to identify the underlying cause.",
        treatment:
            "Treatment depends on the cause. It may include dietary changes, supplements, treatment of an underlying condition or other medical therapies.",
        image:
            "/anemia.webp",
    },

    "Platelet Disorders": {
        overview:
            "Platelet disorders affect the number or function of platelets, which play an important role in blood clotting. Platelet levels that are too low or too high can have different causes and may require specialist evaluation.",
        symptoms: [
            "Easy or unexplained bruising",
            "Frequent nosebleeds",
            "Prolonged bleeding",
            "Small red or purple spots on the skin",
            "Excessive menstrual bleeding",
        ],
        diagnosis:
            "A complete blood count and examination of the blood may help identify an abnormal platelet count. Further investigations may be required depending on the suspected cause.",
        treatment:
            "Treatment varies considerably depending on whether platelet levels are low, high or functioning abnormally and what is causing the problem.",
        image: "/thrombocytopenia.jpg",
    },

    Leukemia: {
        overview:
            "Leukemia is a group of cancers affecting blood-forming tissues, including the bone marrow. It leads to the production of abnormal blood cells and can interfere with the normal production of healthy blood cells.",
        symptoms: [
            "Persistent tiredness",
            "Frequent infections",
            "Unexplained fever",
            "Easy bruising or bleeding",
            "Unexplained weight loss",
        ],
        diagnosis:
            "Assessment may include blood tests, examination of blood cells and, when appropriate, bone marrow examination and other specialised investigations.",
        treatment:
            "Treatment depends on the specific type of leukemia and individual circumstances. Options may include chemotherapy, targeted medicines, immunotherapy and other specialist treatments.",
        image:
            "/leukemia.jpg",
    },

    Lymphoma: {
        overview:
            "Lymphoma is a type of cancer that develops in the lymphatic system. There are many different types, and their behaviour and treatment can vary significantly.",
        symptoms: [
            "Painless swelling of lymph nodes",
            "Persistent fever",
            "Night sweats",
            "Unexplained weight loss",
            "Persistent tiredness",
        ],
        diagnosis:
            "Diagnosis may involve physical examination, blood tests, imaging and, when appropriate, examination of tissue from an affected lymph node.",
        treatment:
            "Treatment depends on the type and stage of lymphoma. It may include chemotherapy, immunotherapy, targeted therapy, radiotherapy or combinations of these approaches.",
        image:
            "/lymphoma.jpg",
    },

    "Blood Clots": {
        overview:
            "Blood clots form naturally to stop bleeding, but a clot that develops inappropriately inside a blood vessel can become dangerous. Conditions involving abnormal clot formation require appropriate medical assessment.",
        symptoms: [
            "Swelling or pain in a limb",
            "Warmth or redness over an affected area",
            "Sudden shortness of breath",
            "Chest pain",
            "Unexplained rapid heartbeat",
        ],
        diagnosis:
            "Diagnosis depends on the location and suspected type of clot. Blood tests and imaging studies may be used when clinically appropriate.",
        treatment:
            "Treatment depends on the location, size and cause of the clot and may involve medicines that reduce the blood's ability to form new clots.",
        image:
            "/bloodclots.jpg",
    },

    "Bleeding Disorders": {
        overview:
            "Bleeding disorders occur when the body's normal clotting process does not work properly. They can result from problems with clotting proteins, platelets or other parts of the blood-clotting system.",
        symptoms: [
            "Easy bruising",
            "Frequent nosebleeds",
            "Bleeding that takes a long time to stop",
            "Heavy menstrual bleeding",
            "Bleeding after procedures or injuries",
        ],
        diagnosis:
            "Evaluation can involve a blood count, clotting tests and specialised laboratory investigations depending on the patient's history and symptoms.",
        treatment:
            "Treatment depends on the specific disorder and may involve replacement of missing clotting factors, medicines or management of the underlying condition.",
        image:
            "/bleedingdisorder.jpg",
    },
};

const fallbackDetails = (title: string, desc: string): DiseaseInfo => ({
    overview: desc,
    symptoms: [
        "Symptoms vary depending on the underlying condition",
        "Changes in energy or general wellbeing",
        "Unusual changes in blood test results",
        "Other symptoms may occur depending on the cause",
    ],
    diagnosis:
        "Diagnosis depends on the patient's symptoms, medical history, examination and appropriate laboratory or imaging investigations.",
    treatment:
        "Treatment depends on the confirmed diagnosis, severity and individual patient circumstances.",
    image:
        "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=85",
});

export default function Diseases() {
    const [openDisease, setOpenDisease] = useState<string | null>(null);

    const handleToggle = (title: string) => {
        setOpenDisease((current) => (current === title ? null : title));
    };

    return (
        <>
            <PageHero
                eyebrow="Diseases & conditions"
                title="Blood disorders, explained in plain language."
                desc="Explore information about common hematology conditions, their symptoms, evaluation and treatment. Diagnosis always requires assessment by a qualified clinician."
            />

            <section className="container py-16 md:py-20">
                {/* INTRO */}
                <div className="mx-auto mb-12 max-w-3xl text-center">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700">
                        Hematology guide
                    </span>

                    <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                        Learn about common blood conditions
                    </h2>

                    <p className="mt-4 text-base leading-7 text-slate-600">
                        Select a condition below to learn more about its symptoms,
                        diagnosis and general treatment approaches.
                    </p>
                </div>

                {/* DISEASE LIST */}
                <div className="max-w-7xl space-y-4">
                    {diseases.map((d, i) => {
                        const isOpen = openDisease === d.title;

                        const details =
                            diseaseDetails[d.title];

                        return (
                            <article
                                key={d.title}
                                className={`overflow-hidden rounded-2xl border bg-white transition-all duration-300 ${isOpen
                                        ? "border-teal-200 shadow-xl shadow-slate-200/50"
                                        : "border-slate-200 shadow-sm hover:border-teal-200 hover:shadow-md"
                                    }`}
                            >
                                {/* DISEASE HEADER */}
                                <button
                                    type="button"
                                    onClick={() => handleToggle(d.title)}
                                    aria-expanded={isOpen}
                                    className="flex w-full items-center gap-5 p-5 text-left md:p-6"
                                >
                                    <span
                                        className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-sm font-black transition ${isOpen
                                                ? "bg-teal-700 text-white"
                                                : "bg-teal-50 text-teal-700"
                                            }`}
                                    >
                                        {String(i + 1).padStart(2, "0")}
                                    </span>

                                    <div className="min-w-0 flex-1">
                                        <span className="text-xs font-bold uppercase tracking-[0.15em] text-teal-700">
                                            {d.tag}
                                        </span>

                                        <h2 className="mt-1 text-lg font-bold text-slate-900 md:text-xl">
                                            {d.title}
                                        </h2>

                                        {!isOpen && (
                                            <p className="mt-1 line-clamp-1 text-sm text-slate-500">
                                                {d.desc}
                                            </p>
                                        )}
                                    </div>

                                    <div
                                        className={`grid h-10 w-10 shrink-0 place-items-center rounded-full transition ${isOpen
                                                ? "rotate-180 bg-teal-50 text-teal-700"
                                                : "bg-slate-50 text-slate-400"
                                            }`}
                                    >
                                        <ChevronDown size={19} />
                                    </div>
                                </button>

                                {/* EXPANDED CONTENT */}
                                <div
                                    className={`grid transition-all duration-300 ${isOpen
                                            ? "grid-rows-[1fr] opacity-100"
                                            : "grid-rows-[0fr] opacity-0"
                                        }`}
                                >
                                    <div className="overflow-hidden">
                                        <div className="border-t border-slate-100 px-5 pb-7 pt-6 md:px-6 md:pb-8">
                                            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
                                                {/* IMAGE */}
                                                <div className="relative min-h-[280px] overflow-hidden rounded-2xl bg-slate-100 lg:min-h-[360px]">
                                                    <img
                                                        src={details.image}
                                                        alt={`${d.title} medical illustration`}
                                                        className="absolute inset-0 h-full w-full object-cover"
                                                    />

                                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/70 to-transparent p-5 pt-16">
                                                        <div className="flex items-center gap-2 text-sm font-semibold text-white">
                                                            <Stethoscope size={16} />
                                                            Hematology information
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* INFORMATION */}
                                                <div>
                                                    <div>
                                                        <span className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">
                                                            Overview
                                                        </span>

                                                        <p className="mt-3 text-sm leading-7 text-slate-600 md:text-base">
                                                            {details.overview}
                                                        </p>
                                                    </div>

                                                    <div className="mt-7">
                                                        <span className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">
                                                            Common symptoms
                                                        </span>

                                                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                                                            {details.symptoms.map((symptom) => (
                                                                <div
                                                                    key={symptom}
                                                                    className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-600"
                                                                >
                                                                    <CheckCircle2
                                                                        size={16}
                                                                        className="mt-0.5 shrink-0 text-teal-600"
                                                                    />
                                                                    <span>{symptom}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="mt-7 grid gap-6 sm:grid-cols-2">
                                                        <div>
                                                            <span className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">
                                                                Diagnosis
                                                            </span>

                                                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                                                {details.diagnosis}
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <span className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">
                                                                Treatment
                                                            </span>

                                                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                                                {details.treatment}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="mt-7 flex flex-wrap gap-3">
                                                        <Link
                                                            href="/appointment"
                                                            className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-teal-800"
                                                        >
                                                            Discuss this condition
                                                            <ArrowRight size={16} />
                                                        </Link>

                                                        <button
                                                            type="button"
                                                            onClick={() => setOpenDisease(null)}
                                                            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                                                        >
                                                            Close
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <p className="mt-7 border-t border-slate-100 pt-5 text-xs leading-6 text-slate-400">
                                                This information is provided for educational purposes
                                                only and should not be used for self-diagnosis or as a
                                                substitute for medical advice.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>

                {/* IMPORTANT */}
                <div className="mx-auto mt-14 max-w-5xl rounded-2xl border border-amber-100 bg-amber-50 p-6 md:p-7">
                    <div className="flex items-start gap-4">
                        <div className="shrink-0 rounded-xl bg-amber-100 p-2.5 text-amber-700">
                            <AlertCircle size={20} />
                        </div>

                        <div>
                            <h3 className="font-bold text-slate-900">
                                When to seek urgent medical attention
                            </h3>

                            <p className="mt-2 text-sm leading-7 text-slate-600">
                                Severe breathlessness, major bleeding, fainting, chest pain,
                                sudden neurological changes or other serious symptoms can
                                require urgent medical attention. Do not wait for a routine
                                appointment when emergency care is needed.
                            </p>
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="mt-12 text-center">
                    <p className="text-sm text-slate-500">
                        Have a blood report or symptoms you would like to discuss?
                    </p>

                    <Link
                        href="/appointment"
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-700 px-7 py-4 text-sm font-bold text-white shadow-lg shadow-teal-700/10 transition hover:bg-teal-800"
                    >
                        Request a consultation
                        <ArrowRight size={17} />
                    </Link>
                </div>
            </section>
        </>
    );
}
