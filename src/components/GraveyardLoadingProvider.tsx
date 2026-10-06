"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { GraveyardLoader } from "./GraveyardLoader";

type GraveyardLoadingContextType = {
  showLoader: () => void;
  hideLoader: () => void;
};

const GraveyardLoadingContext =
  createContext<GraveyardLoadingContextType | null>(null);

export function GraveyardLoadingProvider({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  const showLoader = () => {
    setLoading(true);
  };

  const hideLoader = () => {
    setLoading(false);
  };

  // Hide the loader whenever navigation finishes,
  // including query/filter changes like:
  // /?status=winner
  // /?category=branding
  useEffect(() => {
    setLoading(false);
  }, [pathname, searchParams]);

  return (
    <GraveyardLoadingContext.Provider
      value={{
        showLoader,
        hideLoader,
      }}
    >
      {children}

      {loading ? <GraveyardLoader /> : null}
    </GraveyardLoadingContext.Provider>
  );
}

export function useGraveyardLoading() {
  const context = useContext(GraveyardLoadingContext);

  if (!context) {
    throw new Error(
      "useGraveyardLoading must be used inside GraveyardLoadingProvider",
    );
  }

  return context;
}