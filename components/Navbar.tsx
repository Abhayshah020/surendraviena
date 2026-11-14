"use client";

import Link from "next/link";
import { useState } from "react";
import {
    Menu,
    X,
    Phone,
    CalendarDays,
    ChevronRight,
} from "lucide-react";

const links = [
    ["Home", "/"],
    ["Diseases", "/diseases"],
    ["Procedures", "/procedures"],
    ["Treatments", "/treatments"],
    ["About", "/about"],
    ["Gallery", "/gallery"],
];

export default function Navbar() {
    const [open, setOpen] = useState(false);

    const closeMenu = () => setOpen(false);

    return (
        <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur-xl">
            <div className="container flex h-20 items-center justify-between gap-4">

                {/* LOGO */}
                <Link
                    href="/"
                    onClick={closeMenu}
                    className="relative z-[60] flex items-center gap-3"
                >
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-100">
                        <span className="text-lg font-black">+</span>
                    </div>

                    <div>
                        <div className="text-sm font-extrabold tracking-tight text-slate-900 sm:text-base">
                            Dr. Surendra Prasad Sah
                        </div>
                        <div className="text-xs font-medium text-slate-500">
                            Hematology • Biratnagar
                        </div>
                    </div>
                </Link>

                {/* DESKTOP NAVIGATION */}
                <nav className="hidden items-center gap-7 lg:flex">
                    {links.map(([name, href]) => (
                        <Link
                            key={href}
                            href={href}
                            className="text-sm font-semibold text-slate-600 transition-colors hover:text-teal-700"
                        >
                            {name}
                        </Link>
                    ))}
                </nav>

                {/* DESKTOP ACTIONS */}
                <div className="hidden items-center gap-2 sm:flex">
                    <a
                        href="tel:+9770000000000"
                        aria-label="Call"
                        className="rounded-full p-3 text-teal-700 transition hover:bg-teal-50"
                    >
                        <Phone size={19} />
                    </a>

                    <Link
                        href="/appointment"
                        className="flex items-center gap-2 rounded-full bg-teal-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-teal-100 transition hover:bg-teal-800"
                    >
                        <CalendarDays size={17} />
                        Book appointment
                    </Link>
                </div>

                {/* MOBILE MENU BUTTON */}
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    aria-label="Open navigation menu"
                    aria-expanded={open}
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50 lg:hidden"
                >
                    <Menu size={23} />
                </button>
            </div>

            {/* MOBILE DRAWER */}
            <div
                className={`
                    fixed inset-0 z-[100] lg:hidden
                    pointer-events-none
                `}
                aria-hidden={!open}
            >
                {/* TRANSPARENT CLICK-THROUGH AREA */}
                <div
                    className={`
                        absolute inset-0
                        transition-opacity duration-300
                        ${open ? "opacity-100" : "opacity-0"}
                    `}
                />

                {/* DRAWER */}
                <aside
                    id="mobile-navigation"
                    className={`
                        pointer-events-auto
                        absolute left-0 top-0
                        flex h-dvh w-[100%]
                        flex-col bg-white shadow-2xl
                        transition-transform duration-300 ease-in-out
                        ${open ? "translate-x-0" : "-translate-x-full"}
                    `}
                >
                    {/* DRAWER HEADER */}
                    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5">
                        <div className="flex items-center gap-3">
                            <div className="grid h-10 w-10 place-items-center rounded-xl bg-teal-600 text-white">
                                <span className="text-lg font-black">+</span>
                            </div>

                            <div>
                                <p className="text-sm font-extrabold text-slate-900">
                                    Dr. Surendra Prasad Sah
                                </p>
                                <p className="text-xs text-slate-500">
                                    Hematology • Biratnagar
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={closeMenu}
                            aria-label="Close navigation menu"
                            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                        >
                            <X size={21} />
                        </button>
                    </div>

                    {/* NAVIGATION LINKS */}
                    <nav className="flex-1 overflow-y-auto px-4 py-5">
                        <p className="mb-3 px-3 text-xs font-bold uppercase tracking-widest text-slate-400">
                            Navigation
                        </p>

                        <div className="space-y-1">
                            {links.map(([name, href]) => (
                                <Link
                                    key={href}
                                    href={href}
                                    onClick={closeMenu}
                                    tabIndex={open ? 0 : -1}
                                    className="flex min-h-12 items-center justify-between rounded-xl px-4 py-3 text-base font-semibold text-slate-700 transition-colors hover:bg-teal-50 hover:text-teal-800"
                                >
                                    {name}
                                    <ChevronRight
                                        size={18}
                                        className="text-slate-400"
                                    />
                                </Link>
                            ))}
                        </div>
                    </nav>

                    {/* DRAWER FOOTER */}
                    <div className="border-t border-slate-100 bg-slate-50/70 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                        <a
                            href="tel:+9770000000000"
                            onClick={closeMenu}
                            className="mb-3 flex min-h-12 items-center justify-center gap-2 rounded-xl border border-teal-200 bg-white px-4 py-3 font-bold text-teal-800 transition hover:bg-teal-50"
                            tabIndex={open ? 0 : -1}
                        >
                            <Phone size={18} />
                            Call Now
                        </a>

                        <Link
                            href="/appointment"
                            onClick={closeMenu}
                            tabIndex={open ? 0 : -1}
                            className="flex min-h-14 items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-4 text-base font-bold text-white shadow-lg shadow-teal-100 transition hover:bg-teal-800"
                        >
                            <CalendarDays size={19} />
                            Book Appointment
                        </Link>

                        <p className="mt-4 text-center text-xs text-slate-400">
                            Medical Consultation & Care
                        </p>
                    </div>
                </aside>
            </div>
        </header>
    );
}