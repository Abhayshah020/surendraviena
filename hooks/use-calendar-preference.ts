
"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "clickConvertADBS";
const EVENT_NAME = "calendar-preference-change";

export function useCalendarPreference() {
    const [useBS, setUseBS] = useState(true);
    const [hydrated, setHydrated] = useState(false);

    const readPreference = useCallback(() => {
        const value = localStorage.getItem(STORAGE_KEY);

        const isBS = value === null || value === "true";

        setUseBS(isBS);
    }, []);

    useEffect(() => {
        readPreference();
        setHydrated(true);

        window.addEventListener("storage", readPreference);
        window.addEventListener(EVENT_NAME, readPreference);

        return () => {
            window.removeEventListener("storage", readPreference);
            window.removeEventListener(EVENT_NAME, readPreference);
        };
    }, [readPreference]);

    const updatePreference = useCallback((value: boolean) => {
        localStorage.setItem(STORAGE_KEY, String(value));

        // Immediately update this component
        setUseBS(value);

        // Notify every other component in the same tab
        window.dispatchEvent(new Event(EVENT_NAME));
    }, []);

    const toggleCalendar = useCallback(() => {
        updatePreference(!useBS);
    }, [useBS, updatePreference]);

    return {
        useBS,
        calendarSystem: useBS ? "bs" : "ad",
        hydrated,
        updatePreference,
        toggleCalendar,
    };
}
