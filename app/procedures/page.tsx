import { procedures } from '../../lib/data';
import PageHero from '../../components/PageHero';
import {
    CheckCircle2,
    ArrowRight,
    Stethoscope,
    ShieldCheck,
} from 'lucide-react';

export default function Procedures() {
    return (
        <>
            <PageHero
                eyebrow="Diagnostic Procedures"
                title="Understanding the tests that guide your care."
                desc="Diagnostic procedures help your doctor understand blood disorders, investigate symptoms and monitor your health. The right test depends on your symptoms, blood counts and medical history."
            />

            {/* Intro */}
            <section className="bg-white">
                <div className="container py-16 md:py-20">
                    <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
                        <div>
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-teal-700">
                                <Stethoscope size={15} />
                                Diagnostic approach
                            </div>

                            <h2 className="max-w-3xl text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
                                Every investigation should have a clear purpose.
                            </h2>

                            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
                                Blood tests and other diagnostic procedures can provide
                                important information about how your blood and related
                                systems are functioning. Your doctor will select tests
                                based on your individual situation.
                            </p>
                        </div>

                        <div className="rounded-3xl border border-teal-100 bg-gradient-to-br from-teal-50 via-white to-blue-50 p-7 shadow-sm">
                            <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-white text-teal-600 shadow-sm ring-1 ring-teal-100">
                                <ShieldCheck size={24} />
                            </div>

                            <h3 className="text-lg font-extrabold text-slate-900">
                                Individualized evaluation
                            </h3>

                            <p className="mt-3 text-sm leading-7 text-slate-600">
                                Not every patient needs every test. The choice of
                                investigation is based on symptoms, examination,
                                previous results and medical history.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Procedures */}
            <section className="bg-slate-50/70">
                <div className="container py-20 md:py-24">
                    <div className="mx-auto max-w-6xl">
                        <div className="mb-12 max-w-2xl">
                            <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-600">
                                Common investigations
                            </p>

                            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
                                Procedures and diagnostic tests
                            </h2>

                            <p className="mt-4 leading-7 text-slate-600">
                                Explore the purpose of commonly used diagnostic
                                procedures in hematology.
                            </p>
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">
                            {procedures.map((p, i) => (
                                <article
                                    key={p.title}
                                    className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-teal-200 hover:shadow-xl hover:shadow-teal-900/5"
                                >
                                    {/* Decorative number */}
                                    <div className="absolute right-6 top-4 select-none text-6xl font-black text-teal-50 transition duration-300 group-hover:text-teal-100">
                                        {String(i + 1).padStart(2, '0')}
                                    </div>

                                    <div className="relative">
                                        <div className="mb-6 flex items-center justify-between">
                                            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-50 text-teal-600">
                                                <CheckCircle2 size={21} />
                                            </div>

                                            <span className="rounded-full bg-slate-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                                Procedure
                                            </span>
                                        </div>

                                        <h3 className="max-w-md text-xl font-extrabold text-slate-900 md:text-2xl">
                                            {p.title}
                                        </h3>

                                        <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 md:text-base">
                                            {p.desc}
                                        </p>

                                        <div className="mt-7 flex items-center gap-2 border-t border-slate-100 pt-5 text-xs font-bold uppercase tracking-wider text-teal-600">
                                            <span>Individual test selection</span>
                                            <ArrowRight
                                                size={15}
                                                className="transition-transform group-hover:translate-x-1"
                                            />
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>

                        {/* Bottom note */}
                        <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 md:p-8">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
                                    <Stethoscope size={19} />
                                </div>

                                <div>
                                    <h3 className="font-bold text-slate-900">
                                        What happens next?
                                    </h3>

                                    <p className="mt-2 text-sm leading-7 text-slate-600">
                                        Your doctor will explain why a particular
                                        investigation is recommended and how the
                                        results may help guide the next step in
                                        your evaluation or treatment.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <p className="mt-8 text-center text-xs leading-6 text-slate-400">
                            Information on this page is provided for general
                            educational purposes and does not replace an individual
                            medical consultation or professional medical advice.
                        </p>
                    </div>
                </div>
            </section>
        </>
    );
}