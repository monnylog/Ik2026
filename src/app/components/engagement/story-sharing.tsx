import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mic,
  Square,
  Play,
  Pause,
  Send,
  Shuffle,
  RotateCcw,
  Clock,
  Users,
  Headphones,
} from "lucide-react";
import { getAvatar, getSavedAvatar, getSavedName } from "./avatars";
import { apiFetch } from "../../lib/supabase";
import { useProfile } from "../../lib/profile-context";
import { toast } from "sonner";

import { bodyFont, headingFont } from "../../lib/fonts";

const MAX_DURATION = 60; // seconds

interface VoiceNote {
  id: string;
  author: string;
  avatarId: string;
  caption: string;
  audioBase64: string;
  durationSec: number;
  timestamp: string;
}

// ─── Waveform Visualizer ─────────────────────────────────────────

function WaveformVisualizer({ isRecording }: { isRecording: boolean }) {
  return (
    <div className="flex items-center justify-center gap-[3px] h-10 px-3">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full"
          style={{ backgroundColor: "rgba(205,168,138,0.6)" }}
          animate={
            isRecording
              ? {
                  height: [4, 8 + Math.random() * 24, 4],
                }
              : { height: 4 }
          }
          transition={
            isRecording
              ? {
                  duration: 0.4 + Math.random() * 0.4,
                  repeat: Infinity,
                  repeatType: "reverse" as const,
                  delay: i * 0.03,
                }
              : {}
          }
        />
      ))}
    </div>
  );
}

// ─── Audio Player ────────────────────────────────────────────────

function AudioPlayer({
  audioBase64,
  durationSec,
  compact,
}: {
  audioBase64: string;
  durationSec: number;
  compact?: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<number>();

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const toggle = () => {
    if (!audioRef.current) {
      const audio = new Audio(`data:audio/webm;base64,${audioBase64}`);
      audioRef.current = audio;
      audio.onended = () => {
        setPlaying(false);
        setProgress(0);
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }

    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    } else {
      audioRef.current.play();
      setPlaying(true);
      intervalRef.current = window.setInterval(() => {
        if (audioRef.current) {
          setProgress(audioRef.current.currentTime / (durationSec || 1));
        }
      }, 100);
    }
  };

  return (
    <div className="flex items-center gap-2.5">
      <button
        onClick={toggle}
        className={`${compact ? "w-7 h-7" : "w-8 h-8"} rounded-lg flex items-center justify-center cursor-pointer transition-colors`}
        style={{ backgroundColor: "rgba(205,168,138,0.1)", color: "#CDA88A" }}
      >
        {playing ? (
          <Pause className={compact ? "w-3 h-3" : "w-3.5 h-3.5"} />
        ) : (
          <Play className={compact ? "w-3 h-3" : "w-3.5 h-3.5"} style={{ marginLeft: 1 }} />
        )}
      </button>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(205,168,138,0.1)" }}>
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: "#CDA88A", width: `${progress * 100}%` }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>
      <span className="text-[0.5625rem] text-muted-foreground/40 tabular-nums shrink-0" style={bodyFont}>
        {Math.floor(durationSec / 60)}:{String(Math.floor(durationSec % 60)).padStart(2, "0")}
      </span>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────

export function StorySharing() {
  const { profile } = useProfile();
  const [notes, setNotes] = useState<VoiceNote[]>([]);
  const [loading, setLoading] = useState(true);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedBase64, setRecordedBase64] = useState<string>("");
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [caption, setCaption] = useState("");
  const [sending, setSending] = useState(false);
  const [showRecorder, setShowRecorder] = useState(false);

  // Shuffle mode
  const [shuffleNote, setShuffleNote] = useState<VoiceNote | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number>();
  const startTimeRef = useRef<number>(0);

  const userName = getSavedName();
  const userAvatar = getSavedAvatar();

  // Load notes from server
  const loadNotes = useCallback(async () => {
    try {
      const data = await apiFetch("/voice-notes");
      setNotes(data.notes || []);
    } catch (err) {
      console.error("Failed to load voice notes:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // ─── Recording logic ──────────────────────────────────────────

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setRecordedBlob(blob);

        // Convert to base64
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          // Strip the data:audio/webm;base64, prefix
          const base64 = dataUrl.split(",")[1];
          setRecordedBase64(base64);
        };
        reader.readAsDataURL(blob);

        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start(100);
      startTimeRef.current = Date.now();
      setIsRecording(true);
      setRecordedBlob(null);
      setRecordedBase64("");

      // Duration timer
      timerRef.current = window.setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setRecordingDuration(elapsed);
        if (elapsed >= MAX_DURATION) {
          stopRecording();
        }
      }, 200);
    } catch (err) {
      console.error("Microphone access denied:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const discardRecording = () => {
    setRecordedBlob(null);
    setRecordedBase64("");
    setRecordingDuration(0);
    setCaption("");
  };

  const submitVoiceNote = async () => {
    if (!recordedBase64 || !userName) return;
    setSending(true);

    const note: VoiceNote = {
      id: `vn-${Date.now()}`,
      author: userName,
      avatarId: userAvatar,
      caption: caption.trim(),
      audioBase64: recordedBase64,
      durationSec: Math.round(recordingDuration),
      timestamp: new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
    };

    try {
      await apiFetch("/voice-notes", { method: "POST", body: JSON.stringify({ ...note, userId: profile?.id }) });
      setNotes((prev) => [note, ...prev]);
      discardRecording();
      setShowRecorder(false);
      toast.success("Voice note shared!");
    } catch (err) {
      console.error("Failed to save voice note:", err);
      toast.error("Failed to share voice note.");
    } finally {
      setSending(false);
    }
  };

  // ─── Shuffle ───────────────────────────────────────────────────

  const shuffleRandom = () => {
    if (notes.length === 0) return;
    const available = shuffleNote ? notes.filter((n) => n.id !== shuffleNote.id) : notes;
    if (available.length === 0) return;
    setShuffleNote(available[Math.floor(Math.random() * available.length)]);
  };

  return (
    <div className="space-y-5">
      {/* ─── Header ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-foreground" style={headingFont}>
            Voice Notes
          </h2>
          <p className="text-muted-foreground text-[0.8125rem] mt-0.5" style={bodyFont}>
            Record a voice note to document your perspective, experience, or commentary for the project archive.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {notes.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={shuffleRandom}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-[0.75rem] cursor-pointer"
              style={{
                backgroundColor: "rgba(201,169,110,0.08)",
                border: "1px solid rgba(201,169,110,0.15)",
                color: "#C9A96E",
                ...bodyFont,
              }}
            >
              <Headphones className="w-3.5 h-3.5" />
              Play a voice note
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowRecorder(!showRecorder)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-[0.75rem] text-white cursor-pointer"
            style={{ backgroundColor: "#CDA88A", ...bodyFont }}
          >
            <Mic className="w-3.5 h-3.5" />
            Record
          </motion.button>
        </div>
      </div>

      {/* ─── Shuffle Listener ────────────────────────── */}
      <AnimatePresence>
        {shuffleNote && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-4 rounded-xl"
            style={{
              background: "linear-gradient(135deg, rgba(201,169,110,0.06) 0%, rgba(205,168,138,0.03) 100%)",
              border: "1px solid rgba(201,169,110,0.15)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Headphones className="w-4 h-4" style={{ color: "#C9A96E" }} />
                <span className="text-[0.8125rem] text-foreground" style={headingFont}>
                  Playing voice note
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={shuffleRandom}
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-secondary/50 transition-colors cursor-pointer"
                  title="Next"
                >
                  <Shuffle className="w-3.5 h-3.5 text-muted-foreground/40" />
                </button>
                <button
                  onClick={() => setShuffleNote(null)}
                  className="text-[0.625rem] text-muted-foreground/40 hover:text-muted-foreground cursor-pointer px-2 py-1 rounded-lg hover:bg-secondary/50"
                  style={bodyFont}
                >
                  Close
                </button>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-[1rem] shrink-0"
                style={{ backgroundColor: getAvatar(shuffleNote.avatarId).bg }}
              >
                {getAvatar(shuffleNote.avatarId).emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-[0.8125rem]" style={{ color: getAvatar(shuffleNote.avatarId).color, ...bodyFont }}>
                    {shuffleNote.author}
                  </span>
                  <span className="text-muted-foreground/30 text-[0.625rem]" style={bodyFont}>
                    {shuffleNote.timestamp}
                  </span>
                </div>
                {shuffleNote.caption && (
                  <p className="text-foreground/80 text-[0.8125rem] mb-2 leading-relaxed" style={bodyFont}>
                    {shuffleNote.caption}
                  </p>
                )}
                <AudioPlayer audioBase64={shuffleNote.audioBase64} durationSec={shuffleNote.durationSec} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Recorder ────────────────────────────────── */}
      <AnimatePresence>
        {showRecorder && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div
              className="p-5 rounded-xl"
              style={{
                background: "linear-gradient(135deg, rgba(205,168,138,0.04) 0%, rgba(237,235,226,0.6) 100%)",
                border: "1px solid rgba(205,168,138,0.12)",
              }}
            >
              {!userName ? (
                <p className="text-muted-foreground/50 text-[0.8125rem] text-center py-4" style={bodyFont}>
                  Set your display name in Comms to record.
                </p>
              ) : (
                <>
                  {/* Recording / Preview state */}
                  {!recordedBlob ? (
                    <div className="text-center space-y-4">
                      <p className="text-muted-foreground text-[0.8125rem]" style={bodyFont}>
                        {isRecording
                          ? "Recording in progress."
                          : "Record up to 60 seconds."}
                      </p>

                      {/* Waveform */}
                      <WaveformVisualizer isRecording={isRecording} />

                      {/* Timer */}
                      {isRecording && (
                        <div className="flex items-center justify-center gap-2">
                          <motion.div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: "#CDA88A" }}
                            animate={{ opacity: [1, 0.3, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          />
                          <span className="text-[0.875rem] tabular-nums text-foreground" style={bodyFont}>
                            {Math.floor(recordingDuration / 60)}:
                            {String(Math.floor(recordingDuration % 60)).padStart(2, "0")}
                          </span>
                          <span className="text-muted-foreground/30 text-[0.625rem]" style={bodyFont}>
                            / 1:00
                          </span>
                        </div>
                      )}

                      {/* Record / Stop button */}
                      <div className="flex justify-center">
                        {!isRecording ? (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={startRecording}
                            className="relative w-16 h-16 rounded-full flex items-center justify-center cursor-pointer"
                            style={{ backgroundColor: "#CDA88A" }}
                          >
                            {/* Pulse ring */}
                            <motion.div
                              className="absolute inset-0 rounded-full"
                              style={{ border: "2px solid rgba(205,168,138,0.3)" }}
                              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                            <Mic className="w-6 h-6 text-white" />
                          </motion.button>
                        ) : (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={stopRecording}
                            className="w-16 h-16 rounded-full flex items-center justify-center cursor-pointer"
                            style={{ backgroundColor: "#3B6298" }}
                          >
                            <Square className="w-5 h-5 text-white" />
                          </motion.button>
                        )}
                      </div>
                    </div>
                  ) : (
                    // Preview + Submit
                    <div className="space-y-4">
                      <p className="text-foreground text-[0.8125rem] text-center" style={headingFont}>
                        Review recording
                      </p>

                      <AudioPlayer audioBase64={recordedBase64} durationSec={recordingDuration} />

                      {/* Optional caption */}
                      <div>
                        <label className="text-[0.6875rem] text-muted-foreground/50 block mb-1" style={bodyFont}>
                          Caption (optional)
                        </label>
                        <input
                          type="text"
                          value={caption}
                          onChange={(e) => setCaption(e.target.value)}
                          placeholder="Brief description"
                          className="w-full h-9 px-3 bg-background rounded-lg text-[0.8125rem] text-foreground placeholder:text-muted-foreground/30 border border-border focus:outline-none focus:ring-1 focus:ring-gold/50"
                          style={bodyFont}
                          maxLength={200}
                        />
                      </div>

                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={discardRecording}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[0.75rem] text-muted-foreground hover:bg-secondary/50 transition-colors cursor-pointer"
                          style={{ border: "1px solid var(--border)", ...bodyFont }}
                        >
                          <RotateCcw className="w-3 h-3" />
                          Re-record
                        </button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={submitVoiceNote}
                          disabled={sending}
                          className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-[0.75rem] text-white cursor-pointer"
                          style={{ backgroundColor: "#CDA88A", ...bodyFont }}
                        >
                          <Send className="w-3 h-3" />
                          {sending ? "Submitting" : "Submit"}
                        </motion.button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Voice Notes Feed ────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-3.5 h-3.5 text-muted-foreground/40" />
          <span className="text-[0.6875rem] text-muted-foreground/50" style={bodyFont}>
            {notes.length} {notes.length === 1 ? "recording" : "recordings"}
          </span>
        </div>

        {loading && notes.length === 0 && (
          <p className="text-muted-foreground/30 text-[0.75rem] text-center py-6" style={bodyFont}>
            Loading voice notes
          </p>
        )}

        {!loading && notes.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground/40 text-[0.875rem] mb-1" style={headingFont}>
              No voice notes submitted
            </p>
            <p className="text-muted-foreground/30 text-[0.75rem]" style={bodyFont}>
              No recordings yet. Use the Record button above to contribute.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {notes.map((note) => {
            const av = getAvatar(note.avatarId);
            const isOwn = profile?.id && (note as any).userId === profile.id;
            return (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-card rounded-xl"
                style={{ border: "1px solid var(--border)" }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-[1rem] shrink-0"
                    style={{ backgroundColor: av.bg }}
                  >
                    {av.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-[0.8125rem]" style={{ color: av.color, ...bodyFont }}>
                        {note.author}
                      </span>
                      {isOwn && (
                        <span
                          className="text-[0.5rem] px-1 py-0.5 rounded-full"
                          style={{ backgroundColor: "rgba(201,169,110,0.12)", color: "#C9A96E", ...bodyFont }}
                        >
                          you
                        </span>
                      )}
                      <span className="text-muted-foreground/30 text-[0.625rem]" style={bodyFont}>
                        {note.timestamp}
                      </span>
                    </div>
                    {note.caption && (
                      <p className="text-foreground/80 text-[0.8125rem] mb-2 leading-relaxed" style={bodyFont}>
                        {note.caption}
                      </p>
                    )}
                    <AudioPlayer audioBase64={note.audioBase64} durationSec={note.durationSec} compact />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}