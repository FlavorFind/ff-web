"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { TX, type Lang, type TxKey } from "./data";

interface LangValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TxKey) => string;
}
const LangContext = createContext<LangValue | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const value = useMemo<LangValue>(() => ({ lang, setLang, t: (k) => TX[lang][k] }), [lang]);
  return <LangContext value={value}>{children}</LangContext>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside <LangProvider>");
  return ctx;
}
