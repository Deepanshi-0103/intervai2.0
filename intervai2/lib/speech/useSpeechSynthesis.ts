/**
 * useSpeechSynthesis.ts
 * A React hook that wraps the browser's SpeechSynthesis API so the AI
 * interviewer can read questions aloud.
 */
import { useCallback, useEffect, useRef, useState } from "react";

interface UseSpeechSynthesisReturn {
    isSpeaking: boolean;
    isSupported: boolean;
    speak: (text: string, onEnd?: () => void) => void;
    cancel: () => void;
}

/** Resolve the voices list, waiting for the async voiceschanged event if needed. */
function getVoicesAsync(): Promise<SpeechSynthesisVoice[]> {
    return new Promise((resolve) => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            resolve(voices);
        } else {
            // Chrome loads voices asynchronously — wait for the event
            const handler = () => {
                window.speechSynthesis.removeEventListener("voiceschanged", handler);
                resolve(window.speechSynthesis.getVoices());
            };
            window.speechSynthesis.addEventListener("voiceschanged", handler);
            // Fallback: resolve after 1 s even if the event never fires
            setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1000);
        }
    });
}

export function useSpeechSynthesis(lang = "en-US"): UseSpeechSynthesisReturn {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const onEndRef = useRef<(() => void) | undefined>(undefined);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    const isSupported =
        typeof window !== "undefined" && "speechSynthesis" in window;

    // Cancel any ongoing speech when the component unmounts
    useEffect(() => {
        return () => {
            if (isSupported) window.speechSynthesis.cancel();
        };
    }, [isSupported]);

    const speak = useCallback(
        (text: string, onEnd?: () => void) => {
            if (!isSupported) return;

            // Cancel anything currently playing
            window.speechSynthesis.cancel();
            setIsSpeaking(false);

            onEndRef.current = onEnd;

            const utterance = new SpeechSynthesisUtterance(text);
            utteranceRef.current = utterance;
            utterance.lang = lang;
            utterance.rate = 0.95;
            utterance.pitch = 1;

            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => {
                setIsSpeaking(false);
                onEndRef.current?.();
            };
            utterance.onerror = (e) => {
                // "interrupted" fires when we manually cancel — not a real error
                if ((e as SpeechSynthesisErrorEvent).error === "interrupted") return;
                setIsSpeaking(false);
                onEndRef.current?.();
            };

            // Wait for voices to load (async on Chrome) before speaking
            getVoicesAsync().then((voices) => {
                const preferred = voices.find(
                    (v) =>
                        v.lang.startsWith("en") &&
                        (v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Natural"))
                );
                if (preferred) utterance.voice = preferred;
                window.speechSynthesis.speak(utterance);
            });
        },
        [isSupported, lang]
    );

    const cancel = useCallback(() => {
        if (!isSupported) return;
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    }, [isSupported]);

    return { isSpeaking, isSupported, speak, cancel };
}
