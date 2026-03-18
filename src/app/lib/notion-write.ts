// ─── Notion Write Utilities ─────────────────────────────────────
// Client-side helpers for writing data back to Notion via the write API

import { apiFetch } from "./supabase";
import { toast } from "sonner";

export interface NotionProperty {
  type: "select" | "status" | "multi_select" | "number" | "checkbox" | "date" | "url" | "email" | "title" | "rich_text";
  value: any;
  end?: string | null; // for date ranges
}

export interface NotionWriteParams {
  contentType: string;
  pageId: string;
  properties: Record<string, NotionProperty>;
  successMessage?: string;
  errorMessage?: string;
  showToast?: boolean;
}

/**
 * Write a property update to Notion and invalidate cache
 */
export async function writeToNotion({
  contentType,
  pageId,
  properties,
  successMessage = "Saved to Notion",
  errorMessage = "Sync failed",
  showToast = true,
}: NotionWriteParams): Promise<boolean> {
  try {
    const response = await apiFetch(`/notion/write/${contentType}/${pageId}`, {
      method: "PATCH",
      body: JSON.stringify({ properties }),
    });

    if (response.success) {
      if (showToast) {
        toast.success(successMessage, {
          duration: 2000,
          style: {
            background: "#2D5F2D",
            color: "white",
            border: "1px solid #4E8282",
          },
        });
      }
      return true;
    } else {
      throw new Error(response.error || "Write failed");
    }
  } catch (err: any) {
    console.error("[notion-write] Error:", err);
    if (showToast) {
      toast.error(errorMessage, {
        description: err.message || "Please try again",
        duration: 3000,
        style: {
          background: "#8B2F2F",
          color: "white",
          border: "1px solid #C75B3F",
        },
      });
    }
    return false;
  }
}

/**
 * Batch write multiple pages
 */
export async function batchWriteToNotion(
  updates: Array<{ contentType: string; pageId: string; properties: Record<string, NotionProperty> }>,
  successMessage = "Saved to Notion",
  errorMessage = "Sync failed"
): Promise<{ success: boolean; results: any[] }> {
  try {
    const response = await apiFetch("/notion/write-batch", {
      method: "PATCH",
      body: JSON.stringify({ updates }),
    });

    if (response.success) {
      toast.success(successMessage, {
        duration: 2000,
        style: {
          background: "#2D5F2D",
          color: "white",
          border: "1px solid #4E8282",
        },
      });
      return { success: true, results: response.results || [] };
    } else {
      throw new Error(response.error || "Batch write failed");
    }
  } catch (err: any) {
    console.error("[notion-write] Batch error:", err);
    toast.error(errorMessage, {
      description: err.message || "Some updates may have failed",
      duration: 3000,
      style: {
        background: "#8B2F2F",
        color: "white",
        border: "1px solid #C75B3F",
      },
    });
    return { success: false, results: [] };
  }
}
