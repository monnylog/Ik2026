import { useState, useEffect, useCallback } from "react";

const DRAFT_KEY = "ik2026-onboarding-draft";

export function saveDraft(data: Record<string, any>) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify({
    data,
    savedAt: Date.now(),
  }));
}

export function loadDraft(): Record<string, any> | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.savedAt > 86_400_000) {
      clearDraft();
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

export function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
}

export function DraftToast({
  onRestore,
}: {
  onRestore: (data: Record<string, any>) => void;
}) {
  const [draft, setDraft] = useState<Record<string, any> | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const saved = loadDraft();
    if (saved) {
      setDraft(saved);
      setVisible(true);
    }
  }, []);

  const handleRestore = useCallback(() => {
    if (draft) onRestore(draft);
    setVisible(false);
  }, [draft, onRestore]);

  const handleDiscard = useCallback(() => {
    clearDraft();
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-4">
      <span className="text-sm">You have an unsaved draft</span>
      <button onClick={handleRestore} className="text-sm font-medium text-amber-400 hover:underline">
        Restore
      </button>
      <button onClick={handleDiscard} className="text-sm text-zinc-400 hover:text-white">
        Discard
      </button>
    </div>
  );
}
