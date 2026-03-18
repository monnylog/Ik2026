import { useState } from "react";
import { Save, Loader2, CheckSquare, Square } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "../lib/supabase";
import { bodyFont, headingFont } from "../lib/fonts";

interface DishSubmissionFormProps {
  courseNumber: number;
  courseTitle: string;
  onSuccess?: () => void;
}

export function DishSubmissionForm({ courseNumber, courseTitle, onSuccess }: DishSubmissionFormProps) {
  const [dishName, setDishName] = useState("");
  const [description, setDescription] = useState("");
  const [historicalAnchor, setHistoricalAnchor] = useState("");
  const [dietary, setDietary] = useState({
    glutenFree: false,
    dairyFree: false,
    nutFree: false,
    vegan: false,
    halal: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!dishName.trim() || !description.trim()) {
      toast.error("Please fill in dish name and description");
      return;
    }

    setSubmitting(true);

    try {
      const submission = {
        courseNumber,
        courseTitle,
        dishName: dishName.trim(),
        description: description.trim(),
        historicalAnchor: historicalAnchor.trim(),
        dietaryFlags: dietary,
        submittedAt: new Date().toISOString(),
      };

      await apiFetch("/chef/dish", {
        method: "POST",
        body: JSON.stringify(submission),
      });

      toast.success("Dish concept saved to Notion!");
      
      // Reset form
      setDishName("");
      setDescription("");
      setHistoricalAnchor("");
      setDietary({
        glutenFree: false,
        dairyFree: false,
        nutFree: false,
        vegan: false,
        halal: false,
      });

      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Failed to submit dish:", err);
      toast.error("Failed to submit dish. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-gold/15">
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: "rgba(203,164,122,0.12)" }}
        >
          <Save className="w-3.5 h-3.5" style={{ color: "#CBA47A" }} />
        </div>
        <h4 className="text-foreground text-[0.9375rem]" style={headingFont}>
          Submit Your Dish Concept
        </h4>
      </div>

      {/* Dish Name */}
      <div>
        <label
          htmlFor="dishName"
          className="block text-[0.8125rem] mb-1.5"
          style={{ ...bodyFont, color: "#2E4F52" }}
        >
          Dish Name *
        </label>
        <input
          id="dishName"
          type="text"
          value={dishName}
          onChange={(e) => setDishName(e.target.value)}
          placeholder="e.g., Smoked Salmon Sinigang"
          className="w-full px-3 py-2 rounded-lg border text-[0.875rem] transition-all focus:outline-none focus:ring-2"
          style={{
            ...bodyFont,
            borderColor: "rgba(46,79,82,0.12)",
            backgroundColor: "#FFFFFF",
            color: "#2E4F52",
          }}
          required
        />
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-[0.8125rem] mb-1.5"
          style={{ ...bodyFont, color: "#2E4F52" }}
        >
          Description *
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the dish, key ingredients, and preparation..."
          rows={3}
          className="w-full px-3 py-2 rounded-lg border text-[0.875rem] transition-all focus:outline-none focus:ring-2 resize-none"
          style={{
            ...bodyFont,
            borderColor: "rgba(46,79,82,0.12)",
            backgroundColor: "#FFFFFF",
            color: "#2E4F52",
          }}
          required
        />
      </div>

      {/* Historical Anchor */}
      <div>
        <label
          htmlFor="historicalAnchor"
          className="block text-[0.8125rem] mb-1.5"
          style={{ ...bodyFont, color: "#2E4F52" }}
        >
          Historical Anchor
        </label>
        <textarea
          id="historicalAnchor"
          value={historicalAnchor}
          onChange={(e) => setHistoricalAnchor(e.target.value)}
          placeholder="Optional: How does this dish connect to the historical context of this course?"
          rows={2}
          className="w-full px-3 py-2 rounded-lg border text-[0.875rem] transition-all focus:outline-none focus:ring-2 resize-none"
          style={{
            ...bodyFont,
            borderColor: "rgba(46,79,82,0.12)",
            backgroundColor: "#FFFFFF",
            color: "#2E4F52",
          }}
        />
      </div>

      {/* Dietary Flags */}
      <div>
        <label className="block text-[0.8125rem] mb-2" style={{ ...bodyFont, color: "#2E4F52" }}>
          Dietary Flags
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { key: "glutenFree", label: "Gluten-Free (GF)" },
            { key: "dairyFree", label: "Dairy-Free (DF)" },
            { key: "nutFree", label: "Nut-Free (NF)" },
            { key: "vegan", label: "Vegan" },
            { key: "halal", label: "Halal" },
          ].map((flag) => {
            const isChecked = dietary[flag.key as keyof typeof dietary];
            return (
              <button
                key={flag.key}
                type="button"
                onClick={() =>
                  setDietary((prev) => ({
                    ...prev,
                    [flag.key]: !prev[flag.key as keyof typeof prev],
                  }))
                }
                className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-left"
                style={{
                  ...bodyFont,
                  borderColor: isChecked ? "rgba(203,164,122,0.3)" : "rgba(46,79,82,0.12)",
                  backgroundColor: isChecked ? "rgba(203,164,122,0.08)" : "#FFFFFF",
                  color: isChecked ? "#CBA47A" : "#6B8A8D",
                }}
              >
                {isChecked ? (
                  <CheckSquare className="w-4 h-4" style={{ color: "#CBA47A" }} />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                <span className="text-[0.75rem]">{flag.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={submitting || !dishName.trim() || !description.trim()}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[0.875rem] font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          ...bodyFont,
          backgroundColor: "#2E4F52",
          color: "#FFFDF5",
        }}
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            Submit Dish Concept
          </>
        )}
      </button>

      <p
        className="text-[0.6875rem] text-muted-foreground"
        style={bodyFont}
      >
        Your submission will be saved to Notion and shared with the leadership team.
      </p>
    </form>
  );
}
