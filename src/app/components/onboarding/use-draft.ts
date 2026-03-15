import { useState, useEffect, useRef, useCallback } from "react";
import type { UserRole } from "./use-auth";

const DRAFT_KEY = "ik26-onboarding-draft";

export interface OnboardingDraft {
  step: number;
  role: UserRole | null;
  chefForm: ChefFormData;
  teamForm: TeamFormData;
}

export interface ChefFormData {
  cityOfDeparture: string;
  nearestAirport: string;
  travelMethod: string;
  dietaryRestrictions: string;
  shirtSize: string;
  lodging: string;
  leadTalk: boolean;
  acknowledged: boolean;
  storytelling: string[];
}

export interface TeamFormData {
  fullName: string;
  role: string;
  shirtSize: string;
  availability: string;
  workStyle: string;
}

export const defaultChefForm: ChefFormData = {
  cityOfDeparture: "",
  nearestAirport: "",
  travelMethod: "",
  dietaryRestrictions: "",
  shirtSize: "",
  lodging: "",
  leadTalk: false,
  acknowledged: false,
  storytelling: Array(6).fill(""),
};

export const defaultTeamForm: TeamFormData = {
  fullName: "",
  role: "",
  shirtSize: "",
  availability: "",
  workStyle: "",
};

export function loadDraft(): OnboardingDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OnboardingDraft;
  } catch {
    return null;
  }
}

export function saveDraft(draft: OnboardingDraft) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // silently fail
  }
}

export function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
}

export function useDraftToast() {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const showToast = useCallback(() => {
    setVisible(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setVisible(false), 1800);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { visible, showToast };
}
