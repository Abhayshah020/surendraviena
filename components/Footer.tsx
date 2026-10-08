import Link from "next/link";
import {
    MapPin,
    Phone,
    MessageCircle,
    Facebook,
    ArrowUpRight,
} from "lucide-react";

export default function Footer() {
    return (
        <footer className="bg-[#12323d] text-white">
            <div className="container py-16">
                <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr_1.25fr]">

                    {/* Doctor / Brand */}
                    <div>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-3"
                        >
                            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-500 text-xl font-black shadow-lg shadow-teal-950/20">
                                +
                            </div>

                            <div>
                                <div className="font-extrabold tracking-tight">
                                    Dr. Surendra Prasad Sah
                                </div>

                                <div className="mt-0.5 text-xs font-medium text-teal-200">
                                    Hematology Specialist
                                </div>
                            </div>
                        </Link>

                        <p className="mt-6 max-w-md text-sm leading-7 text-slate-300">
                            Specialist-focused hematology care and
                            patient education in Biratnagar. Learn
                            about blood disorders, treatments and
                            when to seek professional medical advice.
                        </p>

                        <div className="mt-7 flex gap-3">
                            <a
                                href="https://www.facebook.com/internisy"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Facebook"
                                className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:border-teal-400/40 hover:bg-teal-500 hover:text-white"
                            >
                                <Facebook size={18} />
                            </a>

                            <a
                                href="https://wa.me/9779804032442"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="WhatsApp"
                                className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:border-emerald-400/40 hover:bg-emerald-500 hover:text-white"
                            >
                                <MessageCircle size={18} />
                            </a>

                            <a
                                href="tel:+9779804032442"
                                aria-label="Call clinic"
                                className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:border-teal-400/40 hover:bg-teal-500 hover:text-white"
                            >
                                <Phone size={18} />
                            </a>
                        </div>
                    </div>

                    {/* Explore */}
                    <div>
                        <h3 className="mb-5 text-sm font-bold uppercase tracking-wider text-white">
                            Explore
                        </h3>

                        <nav className="grid gap-3 text-sm text-slate-300">
                            <Link
                                href="/diseases"
                                className="transition hover:text-teal-300"
                            >
                                Diseases
                            </Link>

                            <Link
                                href="/procedures"
                                className="transition hover:text-teal-300"
                            >
                                Procedures
                            </Link>

                            <Link
                                href="/treatments"
                                className="transition hover:text-teal-300"
                            >
                                Treatments
                            </Link>

                            <Link
                                href="/gallery"
                                className="transition hover:text-teal-300"
                            >
                                Gallery
                            </Link>
                        </nav>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="mb-5 text-sm font-bold uppercase tracking-wider text-white">
                            Quick links
                        </h3>

                        <nav className="grid gap-3 text-sm text-slate-300">
                            <Link
                                href="/about"
                                className="transition hover:text-teal-300"
                            >
                                About doctor
                            </Link>

                            <Link
                                href="/appointment"
                                className="transition hover:text-teal-300"
                            >
                                Request appointment
                            </Link>

                            <a
                                href="https://www.nobelmedicalcollege.com.np/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 transition hover:text-teal-300"
                            >
                                Nobel Medical College
                                <ArrowUpRight size={13} />
                            </a>

                            <a
                                href="https://maps.google.com/?q=Nobel+Medical+College+Teaching+Hospital+Biratnagar"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="transition hover:text-teal-300"
                            >
                                Open map
                            </a>
                        </nav>
                    </div>

                    {/* Clinic */}
                    <div>
                        <h3 className="mb-5 text-sm font-bold uppercase tracking-wider text-white">
                            Clinic information
                        </h3>

                        <div className="grid gap-5 text-sm text-slate-300">

                            {/* Location */}
                            <a
                                href="https://maps.google.com/?q=Nobel+Medical+College+Teaching+Hospital+Biratnagar"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex gap-3"
                            >
                                <MapPin
                                    size={19}
                                    className="mt-0.5 shrink-0 text-teal-300"
                                />

                                <span className="leading-6 transition group-hover:text-white">
                                    Nobel Medical College
                                    Teaching Hospital
                                    <br />
                                    Biratnagar, Koshi Province,
                                    Nepal
                                </span>
                            </a>

                            {/* Phone */}
                            <a
                                href="tel:+9779804032442"
                                className="group flex items-center gap-3"
                            >
                                <Phone
                                    size={19}
                                    className="shrink-0 text-teal-300"
                                />

                                <span className="transition group-hover:text-white">
                                    +977 9804032442
                                </span>
                            </a>

                            {/* WhatsApp */}
                            <a
                                href="https://wa.me/9779804032442"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex items-center gap-3"
                            >
                                <MessageCircle
                                    size={19}
                                    className="shrink-0 text-teal-300"
                                />

                                <span className="transition group-hover:text-white">
                                    WhatsApp
                                </span>
                            </a>

                            {/* Facebook */}
                            <a
                                href="https://www.facebook.com/internisy"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex items-center gap-3"
                            >
                                <Facebook
                                    size={19}
                                    className="shrink-0 text-teal-300"
                                />

                                <span className="transition group-hover:text-white">
                                    Facebook
                                </span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-white/10">
                <div className="container flex flex-col justify-between gap-3 py-6 text-xs text-slate-400 sm:flex-row sm:items-center">
                    <span>
                        © {new Date().getFullYear()} Dr. Surendra
                        Prasad Sah. All rights reserved.
                    </span>

                    <span className="text-left sm:text-right">
                        Patient-friendly hematology information
                        and consultation support.
                    </span>
                </div>
            </div>
        </footer>
    );
}