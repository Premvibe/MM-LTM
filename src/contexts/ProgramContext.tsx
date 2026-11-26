import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { canUseMidTouch, getProgramModel, isMidTouchOnly, setProgramModel, type ProgramModel } from "@/lib/api";

/**
 * Which program model the app is showing: High touch (fellows) or Mid touch (facilitators).
 *
 * Admins and managers can switch; fellows always see High touch. The API layer sends
 * requests to the matching backend (see lib/api.ts), and pages use useTerms() so that
 * "Fellow" reads "Facilitator" in Mid touch.
 *
 * The Mid touch app (manzil-connect-midtouch) has its own copy of this file that is
 * fixed to Mid touch, so shared pages work unchanged in both apps.
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
  // A Program Manager – Mid Touch is always in Mid touch, so gets no switch
  const midOnly = isMidTouchOnly(user);
  const canSwitch = canUseMidTouch(user?.role) && !midOnly;
  const [model, setModelState] = useState<ProgramModel>(getProgramModel);

  // Fellows (or a signed-out user) always get High touch; Mid touch program managers always Mid
  useEffect(() => {
    if (midOnly) {
      if (model !== "mid") setModelState("mid");
    } else if (!canSwitch && model !== "high") {
      setProgramModel("high");
      setModelState("high");
    } else if (canSwitch && model !== getProgramModel()) {
      // Signed in as an admin who left Mid touch selected last time
      setModelState(getProgramModel());
    }
  }, [canSwitch, midOnly, model]);

  const setModel = useCallback((next: ProgramModel) => {
    setProgramModel(next);
    setModelState(next);
  }, []);

  const value = useMemo<ProgramContextType>(() => ({
    model,
    isMid: model === "mid",
    canSwitch,
    setModel,
    terms: model === "mid" ? MID_TOUCH_TERMS : HIGH_TOUCH_TERMS,
  }), [model, canSwitch, setModel]);

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
