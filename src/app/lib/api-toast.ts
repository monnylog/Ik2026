// ─── API Toast Notifications ────────────────────────────────────
// Centralized toast helpers for API success/error feedback.
// Uses Sonner for lightweight, accessible toast notifications.

import { toast } from "sonner";

/** Show a success toast for completed API operations. */
export function apiSuccess(message: string, description?: string) {
  toast.success(message, {
    description,
    duration: 3000,
    style: {
      background: "rgba(126,158,120,0.12)",
      border: "1px solid rgba(126,158,120,0.25)",
      color: "#3D524D",
    },
  });
}

/** Show an error toast for failed API operations with action context. */
export function apiError(context: string, error?: string | Error) {
  const errorMsg = error instanceof Error ? error.message : error;
  toast.error(context, {
    description: errorMsg || "Please try again or check your connection.",
    duration: 6000,
    style: {
      background: "rgba(164,90,70,0.08)",
      border: "1px solid rgba(164,90,70,0.2)",
      color: "#3D524D",
    },
  });
  console.error(`[API Error] ${context}:`, errorMsg);
}

/** Show a warning toast for degraded/partial success. */
export function apiWarning(message: string, description?: string) {
  toast.warning(message, {
    description,
    duration: 4500,
    style: {
      background: "rgba(201,169,110,0.1)",
      border: "1px solid rgba(201,169,110,0.2)",
      color: "#3D524D",
    },
  });
}

/** Show a loading toast that resolves to success or error. */
export function apiPromise<T>(
  promise: Promise<T>,
  messages: { loading: string; success: string; error: string }
): Promise<T> {
  return new Promise((resolve, reject) => {
    toast.promise(promise, {
      loading: messages.loading,
      success: () => {
        return messages.success;
      },
      error: () => {
        return messages.error;
      },
    });
    promise.then(resolve).catch(reject);
  });
}

/** Show a toast when the Notion sync completes. */
export function notionSyncToast(type: string, itemCount: number) {
  apiSuccess(`${type} synced`, `${itemCount} items loaded from Notion`);
}

/** Show a toast when a lazy-loaded module successfully retries. */
export function moduleRetryToast(moduleName: string) {
  toast.info("Module recovered", {
    description: `"${moduleName}" loaded after retry — connection was briefly interrupted.`,
    duration: 4000,
    style: {
      background: "rgba(74,127,181,0.08)",
      border: "1px solid rgba(74,127,181,0.15)",
      color: "#3D524D",
    },
  });
}

/** Show a toast for successful data export. */
export function exportToast() {
  apiSuccess("Export complete", "Full data backup downloaded as JSON.");
}

/** Show a toast for pre-flight results. */
export function preflightToast(score: string, ready: boolean) {
  if (ready) {
    apiSuccess("All systems go!", `Pre-flight check: ${score} — ready for deployment.`);
  } else {
    apiWarning("Not quite ready", `Pre-flight check: ${score} — review issues below.`);
  }
}
