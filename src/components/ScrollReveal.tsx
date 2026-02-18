"use client";

import { useRef, useEffect, useState, type ReactNode } from "react";

type Variant = "fade-up" | "fade-in" | "scale-in" | "slide-left" | "slide-right";

const variantStyles: Record<Variant, string> = {
  "fade-up": "scroll-reveal-fade-up",
  "fade-in": "scroll-reveal-fade-in",
  "scale-in": "scroll-reveal-scale",
  "slide-left": "scroll-reveal-slide-left",
  "slide-right": "scroll-reveal-slide-right",
};

export function ScrollReveal({
  children,
  variant = "fade-up",
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  variant?: Variant;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            timeoutId = setTimeout(() => setVisible(true), delay);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [delay]);

  const baseClass = variantStyles[variant];
  return (
    <div
      ref={ref}
      className={`${baseClass} ${visible ? "scroll-reveal-visible" : ""} ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : undefined }}
    >
      {children}
    </div>
  );
}
