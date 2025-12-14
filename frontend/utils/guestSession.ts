/**
 * Guest session management utilities
 * Lightweight frontend implementation - session ID only
 */

const GUEST_SESSION_KEY = 'guestSessionId';

/**
 * Get or create guest session ID
 */
export function getGuestSessionId(): string | null {
  return localStorage.getItem(GUEST_SESSION_KEY);
}

/**
 * Create a new guest session
 * Returns the session ID (creates on backend)
 */
export async function createGuestSession(): Promise<string> {
  try {
    // Call backend to create session
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/guest/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      const sessionId = data.data.sessionId;
      localStorage.setItem(GUEST_SESSION_KEY, sessionId);
      return sessionId;
    }
  } catch (error) {
    console.error('Failed to create guest session:', error);
  }

  // Fallback: generate local session ID (will be validated on backend)
  const sessionId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  localStorage.setItem(GUEST_SESSION_KEY, sessionId);
  return sessionId;
}

/**
 * Clear guest session
 */
export function clearGuestSession(): void {
  localStorage.removeItem(GUEST_SESSION_KEY);
}

/**
 * Get guest session ID for API requests
 * Returns null if not in guest mode
 */
export function getGuestSessionHeader(): { 'x-guest-session-id'?: string } {
  // Always attach guest session if it exists, regardless of explicit 'guestMode' flag
  // This ensures API calls match the socket connection which uses the stored ID
  let sessionId = getGuestSessionId();

  if (!sessionId) {
    return {};
  }
  if (!sessionId) {
    // Generate local ID synchronously for headers
    // The formal creation/sync with backend should happen elsewhere or lazily
    sessionId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(GUEST_SESSION_KEY, sessionId);
  }

  return {
    'x-guest-session-id': sessionId,
  };
}

