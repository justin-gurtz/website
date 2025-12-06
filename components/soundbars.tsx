"use client";

import { cn } from "@/utils/tailwind";

const minHeight = "3px";
const sharedClassName = "w-[1.5px] h-[3px] bg-white";

const Soundbars = ({ className }: { className?: string }) => (
  <>
    <style jsx global>{`
      @keyframes soundbar-1 {
        0% {
          height: ${minHeight};
        }
        100% {
          height: 70%;
        }
      }
      @keyframes soundbar-2 {
        0% {
          height: ${minHeight};
        }
        100% {
          height: 90%;
        }
      }
      @keyframes soundbar-3 {
        0% {
          height: ${minHeight};
        }
        100% {
          height: 100%;
        }
      }
      @keyframes soundbar-4 {
        0% {
          height: ${minHeight};
        }
        100% {
          height: 80%;
        }
      }
      @keyframes soundbar-5 {
        0% {
          height: ${minHeight};
        }
        100% {
          height: 60%;
        }
      }
      .animate-soundbar-1 {
        animation: soundbar-1 331ms infinite ease-in-out alternate;
      }
      .animate-soundbar-2 {
        animation: soundbar-2 529ms infinite ease-in-out alternate 0.5s;
      }
      .animate-soundbar-3 {
        animation: soundbar-3 707ms infinite ease-in-out alternate 0.3s;
      }
      .animate-soundbar-4 {
        animation: soundbar-4 648ms infinite ease-in-out alternate 0.7s;
      }
      .animate-soundbar-5 {
        animation: soundbar-5 425ms infinite ease-in-out alternate 0.1s;
      }
    `}</style>
    <div className={cn("flex items-center h-3.5 space-x-[1.5px]", className)}>
      <div className={cn(sharedClassName, "animate-soundbar-1")} />
      <div className={cn(sharedClassName, "animate-soundbar-2")} />
      <div className={cn(sharedClassName, "animate-soundbar-3")} />
      <div className={cn(sharedClassName, "animate-soundbar-4")} />
      <div className={cn(sharedClassName, "animate-soundbar-5")} />
    </div>
  </>
);

export default Soundbars;
