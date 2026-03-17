import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { StickyNote, Check, Trash2, ChevronDown, Plus } from "lucide-react";
import { useUserData } from "../../lib/use-user-data";
import { bodyFont, headingFont } from "../../lib/fonts";

interface Note {
  id: string;
  text: string;
  createdAt: number;
  color: string;
}

const NOTE_COLORS = [
  { bg: "rgba(201,169,110,0.08)", border: "rgba(201,169,110,0.18)", label: "Gold" },
  { bg: "rgba(126,158,120,0.08)", border: "rgba(126,158,120,0.18)", label: "Green" },
  { bg: "rgba(205,168,138,0.08)", border: "rgba(205,168,138,0.18)", label: "Brass" },
  { bg: "rgba(74,127,181,0.08)", border: "rgba(74,127,181,0.18)", label: "Blue" },
];

export function QuickNotes() {
  const [notes, setNotes] = useUserData<Note[]>("quick-notes", []);
  const [expanded, setExpanded] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newNoteText, setNewNoteText] = useState("");
  const [showNewInput, setShowNewInput] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const newInputRef = useRef<HTMLTextAreaElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus new note input when shown
  useEffect(() => {
    if (showNewInput && newInputRef.current) {
      newInputRef.current.focus();
    }
  }, [showNewInput]);

  const addNote = useCallback(() => {
    if (!newNoteText.trim()) return;
    const note: Note = {
      id: `note-${Date.now()}`,
      text: newNoteText.trim(),
      createdAt: Date.now(),
      color: NOTE_COLORS[notes.length % NOTE_COLORS.length].label,
    };
    setNotes([note, ...notes]);
    setNewNoteText("");
    setShowNewInput(false);
  }, [newNoteText, notes, setNotes]);

  const deleteNote = useCallback(
    (id: string) => {
      setNotes(notes.filter((n) => n.id !== id));
      if (editingId === id) setEditingId(null);
    },
    [notes, setNotes, editingId]
  );

  const updateNote = useCallback(
    (id: string, text: string) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        setNotes(notes.map((n) => (n.id === id ? { ...n, text } : n)));
      }, 400);
    },
    [notes, setNotes]
  );

  const getColorConfig = (colorLabel: string) => {
    return NOTE_COLORS.find((c) => c.label === colorLabel) || NOTE_COLORS[0];
  };

  const displayNotes = expanded ? notes : notes.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="bg-card rounded-xl overflow-hidden"
      style={{ border: "1px solid rgba(201,169,110,0.1)" }}
    >
      {/* Header */}
      <div className="px-5 py-4 flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: "rgba(201,169,110,0.1)" }}
        >
          <StickyNote className="w-3.5 h-3.5" style={{ color: "#C9A96E" }} />
        </div>
        <h3
          className="text-foreground flex-1"
          style={headingFont}
        >
          Quick Notes
        </h3>
        {notes.length > 0 && (
          <span
            className="text-[0.5625rem] px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: "rgba(201,169,110,0.1)",
              color: "#C9A96E",
              ...bodyFont,
            }}
          >
            {notes.length}
          </span>
        )}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            setShowNewInput(!showNewInput);
            if (!expanded && notes.length > 0) setExpanded(true);
          }}
          className="w-6 h-6 rounded-md flex items-center justify-center cursor-pointer transition-colors hover:bg-secondary/60"
          aria-label="Add note"
        >
          <Plus
            className={`w-3.5 h-3.5 text-muted-foreground/60 transition-transform duration-200 ${
              showNewInput ? "rotate-45" : ""
            }`}
          />
        </motion.button>
      </div>

      {/* New note input */}
      <AnimatePresence>
        {showNewInput && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3">
              <div
                className="rounded-xl overflow-hidden"
                style={{
                  backgroundColor: "rgba(201,169,110,0.06)",
                  border: "1px solid rgba(201,169,110,0.15)",
                }}
              >
                <textarea
                  ref={newInputRef}
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      addNote();
                    }
                    if (e.key === "Escape") {
                      setShowNewInput(false);
                      setNewNoteText("");
                    }
                  }}
                  placeholder="Jot down a quick thought..."
                  className="w-full bg-transparent px-3 py-2.5 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 resize-none outline-none"
                  style={{ ...bodyFont, minHeight: 60 }}
                  rows={2}
                />
                <div className="flex items-center justify-between px-3 pb-2">
                  <span
                    className="text-[0.5625rem] text-muted-foreground/30"
                    style={bodyFont}
                  >
                    Enter to save · Esc to cancel
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={addNote}
                    disabled={!newNoteText.trim()}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[0.6875rem] cursor-pointer transition-opacity disabled:opacity-30"
                    style={{
                      backgroundColor: "rgba(201,169,110,0.12)",
                      color: "#C9A96E",
                      ...bodyFont,
                    }}
                  >
                    <Check className="w-3 h-3" />
                    Save
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes list */}
      {notes.length > 0 ? (
        <div className="px-4 pb-3 space-y-1.5">
          {displayNotes.map((note, idx) => {
            const cc = getColorConfig(note.color);
            const isEditing = editingId === note.id;
            const age = Date.now() - note.createdAt;
            const timeLabel =
              age < 60000
                ? "just now"
                : age < 3600000
                ? `${Math.floor(age / 60000)}m ago`
                : age < 86400000
                ? `${Math.floor(age / 3600000)}h ago`
                : `${Math.floor(age / 86400000)}d ago`;

            return (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 6 }}
                transition={{ delay: idx * 0.03 }}
                className="group rounded-xl px-3 py-2.5 transition-colors"
                style={{
                  backgroundColor: cc.bg,
                  border: `1px solid ${cc.border}`,
                }}
              >
                {isEditing ? (
                  <textarea
                    ref={textareaRef}
                    defaultValue={note.text}
                    onChange={(e) => updateNote(note.id, e.target.value)}
                    onBlur={() => setEditingId(null)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="w-full bg-transparent text-[0.8125rem] text-foreground resize-none outline-none"
                    style={{ ...bodyFont, minHeight: 40 }}
                    rows={2}
                    autoFocus
                  />
                ) : (
                  <p
                    className="text-foreground text-[0.8125rem] leading-relaxed cursor-pointer"
                    style={bodyFont}
                    onClick={() => setEditingId(note.id)}
                    title="Click to edit"
                  >
                    {note.text}
                  </p>
                )}
                <div className="flex items-center justify-between mt-1.5">
                  <span
                    className="text-[0.5625rem] text-muted-foreground/40"
                    style={bodyFont}
                  >
                    {timeLabel}
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => deleteNote(note.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 rounded flex items-center justify-center cursor-pointer hover:bg-red-500/10"
                    aria-label="Delete note"
                  >
                    <Trash2
                      className="w-3 h-3"
                      style={{ color: "rgba(199,91,63,0.6)" }}
                    />
                  </motion.button>
                </div>
              </motion.div>
            );
          })}

          {notes.length > 3 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 w-full justify-center py-1.5 rounded-lg hover:bg-secondary/40 transition-colors cursor-pointer text-muted-foreground/50"
            >
              <span className="text-[0.6875rem]" style={bodyFont}>
                {expanded ? "Show less" : `${notes.length - 3} more`}
              </span>
              <ChevronDown
                className={`w-3 h-3 transition-transform duration-200 ${
                  expanded ? "rotate-180" : ""
                }`}
              />
            </button>
          )}
        </div>
      ) : (
        !showNewInput && (
          <div className="px-5 pb-5">
            <p
              className="text-muted-foreground/40 text-[0.75rem] text-center"
              style={bodyFont}
            >
              No notes yet. Tap + to jot something down.
            </p>
          </div>
        )
      )}
    </motion.div>
  );
}