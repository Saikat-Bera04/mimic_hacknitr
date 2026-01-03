"use client";
import React from "react";
import { MacbookScroll } from "@/components/ui/macbook-scroll";
import Link from "next/link";

// Peerlist logo
const Badge = ({ className }: { className?: string }) => {
  return (
    <svg
      width="56"
      height="56"
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M56 28C56 43.464 43.464 56 28 56C12.536 56 0 43.464 0 28C0 12.536 12.536 0 28 0C43.464 0 56 12.536 56 28Z"
        fill="hsla(var(--primary))"
      ></path>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M28 54C42.3594 54 54 42.3594 54 28C54 13.6406 42.3594 2 28 2C13.6406 2 2 13.6406 2 28C2 42.3594 13.6406 54 28 54ZM28 56C43.464 56 56 43.464 56 28C56 12.536 43.464 0 28 0C12.536 0 0 12.536 0 28C0 43.464 12.536 56 28 56Z"
        fill="hsla(var(--primary) / 0.8)"
      ></path>
      <path
        d="M27.0769 12H15V46H24.3846V38.8889H27.0769C34.7305 38.8889 41 32.9048 41 25.4444C41 17.984 34.7305 12 27.0769 12ZM24.3846 29.7778V21.1111H27.0769C29.6194 21.1111 31.6154 23.0864 31.6154 25.4444C31.6154 27.8024 29.6194 29.7778 27.0769 29.7778H24.3846Z"
        fill="hsl(var(--primary-foreground))"
      ></path>
    </svg>
  );
};


export function MacbookScrollDemo() {
  return (
    <div className="w-full overflow-hidden bg-background relative">
      <MacbookScroll
        title={
          <span>
            This Macbook is built with TailwindCSS. <br /> No kidding.
          </span>
        }
        badge={
          <Link href="https://github.com/google-gemini/studio-agent-nextjs-starter">
            <Badge className="h-10 w-10 -rotate-12 transform" />
          </Link>
        }
        src={`https://cdn.pixabay.com/video/2023/10/25/199827-879782482_large.mp4`}
        showGradient={true}
      />
    </div>
  );
}
