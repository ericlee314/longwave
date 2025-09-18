import React, { useEffect, useRef, useState } from "react";

type PhaseTimerProps = {
  // Changing this value will reset the timer to 0
  resetKey: string | number;
  // Optional: custom className for positioning
  className?: string;
};

export function PhaseTimer(props: PhaseTimerProps) {
  const { resetKey, className } = props;

  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const intervalRef = useRef<number | null>(null);

  // Start/Restart timer when resetKey changes
  useEffect(() => {
    setElapsedSeconds(0);

    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
    }

    intervalRef.current = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [resetKey]);

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const isOverMinute = elapsedSeconds >= 60;

  const textStyle: React.CSSProperties = {
    fontWeight: 600,
    color: isOverMinute ? "#c0392b" : "#333",
  };

  const containerStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "flex-end",
    padding: "4px 8px",
  };

  return (
    <div className={className} style={containerStyle}>
      <span style={textStyle} aria-label="phase timer">
        {minutes}:{seconds.toString().padStart(2, "0")}
      </span>
    </div>
  );
}

