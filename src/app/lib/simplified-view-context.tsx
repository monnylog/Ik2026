import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface SimplifiedViewContextType {
  simplified: boolean;
  toggleSimplified: () => void;
  setSimplified: (v: boolean) => void;
}

const SimplifiedViewContext = createContext<SimplifiedViewContextType>({
  simplified: false,
  toggleSimplified: () => {},
  setSimplified: () => {},
});

const STORAGE_KEY = "ik26-simplified-view";

export function SimplifiedViewProvider({ children }: { children: ReactNode }) {
  const [simplified, setSimplifiedState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const setSimplified = useCallback((v: boolean) => {
    setSimplifiedState(v);
    try {
      localStorage.setItem(STORAGE_KEY, String(v));
    } catch {}
  }, []);

  const toggleSimplified = useCallback(() => {
    setSimplified(!simplified);
  }, [simplified, setSimplified]);

  return (
    <SimplifiedViewContext.Provider value={{ simplified, toggleSimplified, setSimplified }}>
      {children}
    </SimplifiedViewContext.Provider>
  );
}

export function useSimplifiedView() {
  return useContext(SimplifiedViewContext);
}
