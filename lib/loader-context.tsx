"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type LoaderContextValue = {
  ready: boolean;
  onLoaded: () => void;
};

const LoaderContext = createContext<LoaderContextValue>({
  ready: false,
  onLoaded: () => {},
});

export function LoaderProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const onLoaded = useCallback(() => setReady(true), []);

  return (
    <LoaderContext.Provider value={{ ready, onLoaded }}>
      {children}
    </LoaderContext.Provider>
  );
}

export function useLoader() {
  return useContext(LoaderContext);
}
