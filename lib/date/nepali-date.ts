
import {
    convertAdToBs,
    convertBsToAd,
    formatBsDateByPattern,
} from "@nepali-date-picker/core";

function toISODate(year: number, month: number, day: number): string {
    return [
        String(year).padStart(4, "0"),
        String(month).padStart(2, "0"),
        String(day).padStart(2, "0"),
    ].join("-");
}

/**
 * Existing application AD date -> BS date.
 * Input/output: YYYY-MM-DD
 */
export function adToBs(adDate: string): string {
    if (!adDate) return "";

    const [year, month, day] = adDate.split("-").map(Number);

    if (!year || !month || !day) return "";

    const bs = convertAdToBs(year, month, day);

    return toISODate(bs.year, bs.month, bs.dayOfMonth);
}

/**
 * BS date -> existing application AD date.
 * Input/output: YYYY-MM-DD
 */
export function bsToAd(bsDate: string): string {
    if (!bsDate) return "";

    const [year, month, day] = bsDate.split("-").map(Number);

    if (!year || !month || !day) return "";

    const ad = convertBsToAd(year, month, day);

    return toISODate(ad.year, ad.month, ad.dayOfMonth);
}

/**
 * Display an existing AD date in readable Nepali BS format.
 * Input: AD YYYY-MM-DD
 * Output: BS date (e.g. Wednesday, Kartik 25, 2083)
 */
export function formatBS(adDate: string): string {
    if (!adDate) return "";

    const [year, month, day] = adDate.split("-").map(Number);

    if (!year || !month || !day) return "";

    const bs = convertAdToBs(year, month, day);

    return formatBsDateByPattern(
        "EEEE, MMMM d, yyyy",
        bs.year,
        bs.month,
        bs.dayOfMonth,
        "en"
    );
}

/**
 * Today's local AD date.
 */
export function getTodayAD(): string {
    const today = new Date();

    return toISODate(
        today.getFullYear(),
        today.getMonth() + 1,
        today.getDate()
    );
}

/**
 * Today's BS date.
 */
export function getTodayBS(): string {
    return adToBs(getTodayAD());
}

/**
 * Format AD date as Nepali BS: Sun, DD/MM/YYYY
 * Input: AD YYYY-MM-DD
 * Output: BS weekday, DD/MM/YYYY
 */
export function formatADShort(adDate: string): string {
    if (!adDate) return "";

    const [year, month, day] = adDate.split("-").map(Number);

    if (!year || !month || !day) return "";

    // Convert AD to BS
    const bs = convertAdToBs(year, month, day);

    // Get weekday from the original AD date
    // Weekdays remain the same in both calendars.
    const date = new Date(year, month - 1, day);

    const weekday = new Intl.DateTimeFormat("en", {
        weekday: "short",
    }).format(date);

    return `${weekday}, ${String(bs.dayOfMonth).padStart(2, "0")}/${String(bs.month).padStart(2, "0")}/${bs.year}`;
}

/**
 * Format ISO timestamp as Nepali BS date and Nepal time.
 *
 * Input: 2026-11-14T03:48:13.286Z
 * Output: Saturday, Kartik 28, 2083 | 9:33 AM
 */
export function formatBSDateTime(dateTime: string): string {
    if (!dateTime) return "";

    const date = new Date(dateTime);

    if (Number.isNaN(date.getTime())) return "";

    // Get Nepal local date and time
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Kathmandu",
        year: "numeric",
        month: "numeric",
        day: "numeric",
        weekday: "long",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    }).formatToParts(date);

    const get = (type: Intl.DateTimeFormatPartTypes) =>
        parts.find((part) => part.type === type)?.value || "";

    const year = Number(get("year"));
    const month = Number(get("month"));
    const day = Number(get("day"));

    // Convert Nepal local AD date to BS
    const bs = convertAdToBs(year, month, day);

    const bsFormatted = formatBsDateByPattern(
        "EEEE, MMMM d, yyyy",
        bs.year,
        bs.month,
        bs.dayOfMonth,
        "en"
    );

    const time = `${get("hour")}:${get("minute")} ${get("dayPeriod")}`;

    return `${bsFormatted} | ${time}`;
}

/**
 * Format ISO timestamp as short Nepali BS date and Nepal time.
 *
 * Input: 2026-11-14T03:48:13.286Z
 * Output: 7, 28, 2083, 9:33 AM
 */
export function formatBSDateTimeShort(dateTime: string): string {
    if (!dateTime) return "";

    const date = new Date(dateTime);

    if (Number.isNaN(date.getTime())) return "";

    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Kathmandu",
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    }).formatToParts(date);

    const get = (type: Intl.DateTimeFormatPartTypes) =>
        parts.find((part) => part.type === type)?.value || "";

    const year = Number(get("year"));
    const month = Number(get("month"));
    const day = Number(get("day"));

    const bs = convertAdToBs(year, month, day);

    const time = `${get("hour")}:${get("minute")} ${get("dayPeriod")}`;

    return `${bs.month}/${bs.dayOfMonth}/${bs.year}, ${time}`;
}