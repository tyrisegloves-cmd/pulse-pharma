"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  /** Stagger delay in ms before the reveal transition starts */
  delay?: number;
  className?: string;
}

/**
 * Fades and slides content up gently when it enters the viewport.
 * Uses a shared IntersectionObserver for efficiency.
 * Respects prefers-reduced-motion (handled in globals.css — content
 * is always visible and static for those users).
 */

let sharedObserver: IntersectionObserver | null = null;
const observedElements = new WeakSet<Element>();

function getSharedObserver(
  callback: IntersectionObserverCallback
): IntersectionObserver {
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(callback, {
      threshold: 0.15,
      rootMargin: "0px 0px -40px 0px",
    });
  }
  return sharedObserver;
}

export function Reveal({ children, delay = 0, className = "" }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // If reduced motion is preferred, show immediately without observing.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    // Only create observer if not already observing this element
    if (!observedElements.has(node)) {
      const observer = getSharedObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
            observedElements.delete(entry.target);
          }
        });
      });

      observer.observe(node);
      observedElements.add(node);

      return () => {
        if (observedElements.has(node)) {
          observer.unobserve(node);
          observedElements.delete(node);
        }
      };
    }
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? "is-visible" : ""} ${className}`}
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
