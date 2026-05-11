import { useRef } from "react";

export default function OTPInput({ value, onChange, length = 4 }) {
  const refs = useRef([]);

  const handleChange = (i, v) => {
    const digit = v.replace(/\D/g, "").slice(-1);
    const arr = (value || "").padEnd(length, " ").split("");
    arr[i] = digit || " ";
    const next = arr.join("").replace(/\s/g, "");
    onChange(next.slice(0, length));
    if (digit && i < length - 1) {
      refs.current[i + 1]?.focus();
    }
  };

  const handleKey = (i, e) => {
    if (e.key === "Backspace" && !value[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < length - 1) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    e.preventDefault();
    onChange(pasted);
    refs.current[Math.min(pasted.length, length - 1)]?.focus();
  };

  return (
    <div className="flex gap-3" onPaste={handlePaste} data-testid="otp-input">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          className="otp-input"
          data-testid={`otp-digit-${i}`}
        />
      ))}
    </div>
  );
}
