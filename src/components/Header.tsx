"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const mainNavLinks = [
  { href: "/humanize", label: "AI Humanizer" },
  { href: "/ai-check", label: "AI Detector" },
];

const toolsDropdownLinks = [
  { href: "/paraphrase", label: "Paraphraser" },
  { href: "/grammar-checker", label: "Grammar checker" },
  { href: "/summarizer", label: "Summarizer" },
  { href: "/translator", label: "Translator" },
];

const otherLinks = [
  { href: "/pricing", label: "Pricing" },
  { href: "/help", label: "Help" },
];

const allToolPaths = toolsDropdownLinks.map((l) => l.href);

function isToolsActive(pathname: string) {
  return allToolPaths.some((path) => pathname === path || pathname.startsWith(path + "/"));
}

export function Header() {
  const pathname = usePathname();
  const [toolsOpen, setToolsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user?.email ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
      if (!session) setUsername(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userEmail) return;
    fetch("/api/account")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data?.profile?.username && setUsername(data.profile.username))
      .catch(() => {});
  }, [userEmail]);

  useEffect(() => {
    setToolsOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setToolsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-primary-100/80 bg-header-gradient shadow-sm shadow-primary-900/5 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center font-bold text-neutral-900">
          <span className="bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">Bypassr</span><span className="text-neutral-700">AI</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {mainNavLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded px-3 py-2 text-sm font-medium transition-colors hover:text-primary-600 ${
                pathname === link.href ? "text-primary-600" : "text-neutral-600"
              }`}
            >
              {link.label}
            </Link>
          ))}

          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setToolsOpen((o) => !o)}
              className={`flex items-center gap-1 rounded px-3 py-2 text-sm font-medium transition-colors hover:text-primary-600 ${
                isToolsActive(pathname) ? "text-primary-600" : "text-neutral-600"
              }`}
              aria-expanded={toolsOpen}
              aria-haspopup="true"
            >
              Tools
              <svg
                className={`h-4 w-4 transition-transform ${toolsOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {toolsOpen && (
              <div className="absolute left-0 top-full z-50 mt-1 min-w-[180px] rounded-xl border border-primary-100 bg-white py-1 shadow-lg shadow-primary-900/5">
                {toolsDropdownLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`block px-4 py-2 text-sm transition-colors hover:bg-neutral-50 hover:text-primary-600 ${
                      pathname === link.href ? "bg-primary-50 text-primary-600" : "text-neutral-700"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {otherLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded px-3 py-2 text-sm font-medium transition-colors hover:text-primary-600 ${
                pathname === link.href ? "text-primary-600" : "text-neutral-600"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {/* Desktop: nav + account */}
          <nav className="hidden md:flex items-center gap-3">
            {userEmail ? (
              <>
                <Link
                  href="/account"
                  className="text-sm font-medium text-neutral-600 transition-colors hover:text-primary-600"
                >
                  Account
                </Link>
                <span className="text-sm text-neutral-400" title={userEmail}>
                  {username ?? userEmail.replace(/(.{2}).*(@.*)/, "$1…$2")}
                </span>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-primary-600/25 transition hover:bg-primary-700"
                >
                  Try for free
                </Link>
              </>
            )}
          </nav>

          {/* Mobile: hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute left-0 right-0 top-16 z-40 border-b border-primary-100/80 bg-white shadow-lg backdrop-blur">
          <nav className="mx-auto max-w-6xl px-4 py-4 flex flex-col gap-1">
            {mainNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  pathname === link.href ? "bg-primary-50 text-primary-600" : "text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-neutral-100 pt-2 mt-1">
              <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Tools</div>
              {toolsDropdownLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                    pathname === link.href ? "bg-primary-50 text-primary-600" : "text-neutral-700 hover:bg-neutral-50"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            {otherLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  pathname === link.href ? "bg-primary-50 text-primary-600" : "text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-neutral-100 pt-2 mt-1">
              {userEmail ? (
                <Link
                  href="/account"
                  className="block rounded-lg px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  Account
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="block rounded-lg px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="mx-4 mt-2 block rounded-xl bg-primary-600 py-3 text-center text-sm font-semibold text-white"
                  >
                    Try for free
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
