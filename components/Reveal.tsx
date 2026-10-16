"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  /** "rise" slides up; "pop" slides up and scales in slightly */
  variant?: "rise" | "pop";
  /** Position in a group, used to stagger neighbours */
  index?: number;
  as?: "div" | "section" | "li" | "article" | "header";
  className?: string;
  id?: string;
};

/**
 * Shows its content with a short rise/pop the first time it scrolls into view.
 * Without JavaScript, or with reduced motion, content is simply visible.
 */
export default function Reveal({
  children,
  variant = "rise",
  index = 0,
  as: Tag = "div",
  className,
  id,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.setAttribute("data-shown", "");
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-shown", "");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={(node: HTMLElement | null) => {
        ref.current = node;
      }}
      id={id}
      data-reveal={variant}
      className={className}
      style={{ "--i": index } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
