// ─── Global type augmentation ─────────────────────────────────────────────────
// TypeScript's lib.dom.d.ts omits `SpeechRecognition` from the Window interface.
// We manually declare the constructor signatures here so TypeScript is happy.
declare global {
    interface SpeechRecognitionEvent extends Event {
        readonly resultIndex: number;
        readonly results: SpeechRecognitionResultList;
    }

    interface SpeechRecognitionErrorEvent extends Event {
        readonly error: string;
        readonly message: string;
    }

    interface SpeechRecognitionResult {
        readonly isFinal: boolean;
        readonly length: number;
        item(index: number): SpeechRecognitionAlternative;
        [index: number]: SpeechRecognitionAlternative;
    }

    interface SpeechRecognitionAlternative {
        readonly transcript: string;
        readonly confidence: number;
    }

    interface SpeechRecognitionResultList {
        readonly length: number;
        item(index: number): SpeechRecognitionResult;
        [index: number]: SpeechRecognitionResult;
    }

    interface SpeechRecognition extends EventTarget {
        lang: string;
        continuous: boolean;
        interimResults: boolean;
        maxAlternatives: number;
        start(): void;
        stop(): void;
        abort(): void;
        onresult: ((event: SpeechRecognitionEvent) => void) | null;
        onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
        onend: (() => void) | null;
        onstart: (() => void) | null;
    }

    interface SpeechRecognitionConstructor {
        new(): SpeechRecognition;
    }

    interface Window {
        SpeechRecognition: SpeechRecognitionConstructor;
        webkitSpeechRecognition: SpeechRecognitionConstructor;
    }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
import { useCallback, useEffect, useRef, useState } from "react";

interface UseSpeechRecognitionReturn {
    /** Finalized speech text accumulated in the current listening session */
    transcript: string;
    /** Live, in-progress (interim) text being spoken right now */
    interimTranscript: string;
    isListening: boolean;
    isSupported: boolean;
    startListening: (options?: { onResult?: (text: string) => void }) => void;
    stopListening: () => void;
    resetTranscript: () => void;
}

export function useSpeechRecognition(lang = "en-US"): UseSpeechRecognitionReturn {
    const [transcript, setTranscript] = useState("");
    const [interimTranscript, setInterimTranscript] = useState("");
    const [isListening, setIsListening] = useState(false);

    // Holds the currently active recognition instance. Replaced fresh each session.
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    // Ref so onend/onerror closures always read the latest intent, not a stale closure.
    const isListeningRef = useRef(false);
    const onResultRef = useRef<((text: string) => void) | undefined>(undefined);

    const isSupported =
        typeof window !== "undefined" &&
        ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

    // Abort any running instance when the component unmounts
    useEffect(() => {
        return () => {
            isListeningRef.current = false;
            recognitionRef.current?.abort();
        };
    }, []);

    /**
     * Build a brand-new SpeechRecognition instance with all handlers wired up.
     * We create a fresh object for every listening session instead of reusing one
     * because Chrome's SpeechRecognition is not reliably restartable after stop().
     */
    const buildRecognition = useCallback((): SpeechRecognition | null => {
        if (!isSupported) return null;
        const API = window.SpeechRecognition ?? window.webkitSpeechRecognition;
        const rec = new API();
        rec.lang = lang;
        rec.continuous = true;
        rec.interimResults = true;

        rec.onresult = (event: SpeechRecognitionEvent) => {
            let finalChunk = "";
            let interimChunk = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) finalChunk += result[0].transcript;
                else interimChunk += result[0].transcript;
            }
            if (finalChunk) {
                setTranscript((prev) => prev + finalChunk);
                onResultRef.current?.(finalChunk);
            }
            setInterimTranscript(interimChunk);
        };

        rec.onerror = (event: SpeechRecognitionErrorEvent) => {
            // "no-speech" = silence timeout (non-fatal), "aborted" = manual cancel
            if (event.error === "no-speech" || event.error === "aborted") return;
            console.error("[SpeechRecognition] error:", event.error);
            isListeningRef.current = false;
            setIsListening(false);
            setInterimTranscript("");
        };

        rec.onend = () => {
            setInterimTranscript("");
            if (!isListeningRef.current) {
                // Intentional stop — just update UI
                setIsListening(false);
                return;
            }
            // Chrome fires onend after ~7 s of silence even with continuous=true.
            // Spin up a fresh instance and restart seamlessly.
            const next = buildRecognition();
            if (!next) {
                isListeningRef.current = false;
                setIsListening(false);
                return;
            }
            recognitionRef.current = next;
            try {
                next.start();
            } catch (e) {
                console.error("[SpeechRecognition] auto-restart failed:", e);
                isListeningRef.current = false;
                setIsListening(false);
            }
        };

        return rec;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSupported, lang]);

    const startListening = useCallback(
        (options?: { onResult?: (text: string) => void }) => {
            if (!isSupported || isListeningRef.current) return;

            // Cleanly abort any leftover instance from a previous session
            recognitionRef.current?.abort();
            recognitionRef.current = null;

            const rec = buildRecognition();
            if (!rec) return;

            recognitionRef.current = rec;
            onResultRef.current = options?.onResult;
            setTranscript("");
            setInterimTranscript("");
            isListeningRef.current = true;
            setIsListening(true);

            try {
                rec.start();
            } catch (e) {
                console.error("[SpeechRecognition] start() failed:", e);
                isListeningRef.current = false;
                setIsListening(false);
            }
        },
        [isSupported, buildRecognition]
    );

    const stopListening = useCallback(() => {
        if (!isListeningRef.current) return;
        isListeningRef.current = false;
        setIsListening(false);
        recognitionRef.current?.stop();
        recognitionRef.current = null;
    }, []);

    const resetTranscript = useCallback(() => {
        setTranscript("");
        setInterimTranscript("");
    }, []);

    return {
        transcript,
        interimTranscript,
        isListening,
        isSupported,
        startListening,
        stopListening,
        resetTranscript,
    };
}