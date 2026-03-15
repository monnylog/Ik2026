import { useEffect } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { useSWUpdate } from "../../lib/use-sw-update";
import { APP_VERSION } from "../../lib/version";

const bodyFont = { fontFamily: "'Inter', sans-serif" };

/**
 * Watches for SW updates and shows a persistent sonner toast
 * with "Update available — click to refresh".
 */
export function SWUpdateToast() {
  const { updateAvailable, applyUpdate, dismissUpdate } = useSWUpdate();

  useEffect(() => {
    if (!updateAvailable) return;

    toast(
      <div className="flex items-center gap-3" style={bodyFont}>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background: "linear-gradient(135deg, #C9A96E, #CDA88A)",
          }}
        >
          <RefreshCw className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[0.8125rem] font-semibold text-foreground">
            Update available
          </p>
          <p className="text-[0.6875rem] text-muted-foreground">
            v{APP_VERSION} — Click to refresh and get the latest version.
          </p>
        </div>
      </div>,
      {
        duration: Infinity,
        id: "sw-update",
        action: {
          label: "Refresh",
          onClick: applyUpdate,
        },
        cancel: {
          label: "Later",
          onClick: dismissUpdate,
        },
        style: {
          border: "1px solid rgba(201,169,110,0.25)",
          backgroundColor: "rgba(248,245,239,0.98)",
        },
      }
    );

    return () => {
      toast.dismiss("sw-update");
    };
  }, [updateAvailable, applyUpdate, dismissUpdate]);

  return null;
}