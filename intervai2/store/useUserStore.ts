/**
 * useUserStore.ts
 * Lightweight store for authenticated user profile data.
 * Sits above Firebase auth so components can read cached user info
 * without subscribing to Firebase directly.
 */

export interface UserProfile {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
}

/** Returns initials (max 2 chars) from a display name or email */
export function getUserInitials(profile: UserProfile | null): string {
    if (!profile) return "U";
    if (profile.displayName) {
        return profile.displayName
            .split(" ")
            .slice(0, 2)
            .map((n) => n[0])
            .join("")
            .toUpperCase();
    }
    return (profile.email?.[0] ?? "U").toUpperCase();
}

/** Returns a friendly greeting name */
export function getDisplayName(profile: UserProfile | null): string {
    if (!profile) return "User";
    return profile.displayName ?? profile.email?.split("@")[0] ?? "User";
}
