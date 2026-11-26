import React, { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { handoffUrl } from "@/components/LoginHandoff";
import { canUseMidTouch, isMidTouchOnly, forgetOldProgramChoice, MIDTOUCH_APP_URL, type ProgramModel } from "@/lib/api";

/**
 * This app is always High touch (fellows). Mid touch has its own website
 * (manzil-connect-midtouch, mm-ltm-mid-touch.vercel.app) for facilitators, admins and managers.
 * Admins and managers get the sidebar's High Touch / Mid Touch switch: choosing Mid Touch opens
 * that website. Pages use useTerms() so the same page files work in both apps.
 */

export type Terms = {
  fellow: string;
  fellows: string;
  Fellow: string;
  Fellows: string;
  /** e.g. "High Touch" */
  programName: string;
};

export const HIGH_TOUCH_TERMS: Terms = { fellow: "fellow", fellows: "fellows", Fellow: "Fellow", Fellows: "Fellows", programName: "High Touch" };
export const MID_TOUCH_TERMS: Terms = { fellow: "facilitator", fellows: "facilitators", Fellow: "Facilitator", Fellows: "Facilitators", programName: "Mid Touch" };

interface ProgramContextType {
  model: ProgramModel;
  isMid: boolean;
  /** True when this user may switch between High touch and Mid touch */
  canSwitch: boolean;
  setModel: (model: ProgramModel) => void;
  terms: Terms;
}

const ProgramContext = createContext<ProgramContextType | null>(null);

export function ProgramProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const canSwitch = canUseMidTouch(user?.role) && !isMidTouchOnly(user);

  useEffect(forgetOldProgramChoice, []);

  // Opens the Mid touch website, signed in with the same account
  const setModel = useCallback((next: ProgramModel) => {
    if (next === "mid" && user) window.location.assign(handoffUrl(MIDTOUCH_APP_URL, user));
  }, [user]);

  const value = useMemo<ProgramContextType>(() => ({
    model: "high",
    isMid: false,
    canSwitch,
    setModel,
    terms: HIGH_TOUCH_TERMS,
  }), [canSwitch, setModel]);

  return <ProgramContext.Provider value={value}>{children}</ProgramContext.Provider>;
}

export function useProgram() {
  const ctx = useContext(ProgramContext);
  if (!ctx) throw new Error("useProgram must be used within ProgramProvider");
  return ctx;
}

/** Wording for the current program model: terms.Fellow is "Fellow" or "Facilitator". */
export function useTerms(): Terms {
  return useProgram().terms;
}
