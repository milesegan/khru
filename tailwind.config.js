/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "oklch(98% 0.02 75)",
        "paper-strong": "oklch(94% 0.03 70)",
        ink: "oklch(24% 0.03 30)",
        muted: "oklch(44% 0.03 38)",
        accent: "oklch(53% 0.12 45)",
        "accent-soft": "oklch(83% 0.06 55)",
        edge: "oklch(78% 0.03 60)",
      },
      fontFamily: {
        sans: ['"Atkinson Hyperlegible Next"', '"Segoe UI"', "sans-serif"],
        serif: ['"Fraunces"', "Georgia", "serif"],
      },
      keyframes: {
        "fade-in": {
          from: {
            opacity: "0",
            transform: "translateY(10px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "known-word-pulse": {
          "0%": {
            transform: "scale(1)",
            filter: "drop-shadow(0 0 0 rgba(34, 197, 94, 0))",
          },
          "18%": {
            transform: "scale(1.18)",
            filter: "drop-shadow(0 0 18px rgba(110, 231, 183, 0.36))",
          },
          "36%": {
            transform: "scale(1.06)",
            filter: "drop-shadow(0 0 10px rgba(34, 197, 94, 0.22))",
          },
          "58%": {
            transform: "scale(1.24)",
            filter: "drop-shadow(0 0 28px rgba(110, 231, 183, 0.44))",
          },
          "78%": {
            transform: "scale(1.1)",
            filter: "drop-shadow(0 0 12px rgba(34, 197, 94, 0.2))",
          },
          "100%": {
            transform: "scale(1)",
            filter: "drop-shadow(0 0 0 rgba(34, 197, 94, 0))",
          },
        },
        "known-support-pulse": {
          "0%": {
            transform: "scale(1)",
            opacity: "1",
          },
          "28%": {
            transform: "scale(1.035)",
            opacity: "1",
          },
          "54%": {
            transform: "scale(1.015)",
            opacity: "0.94",
          },
          "100%": {
            transform: "scale(1)",
            opacity: "1",
          },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out forwards",
        "known-word-pulse":
          "known-word-pulse 0.46s cubic-bezier(0.16, 1, 0.3, 1)",
        "known-support-pulse":
          "known-support-pulse 0.46s cubic-bezier(0.25, 1, 0.5, 1)",
      },
    },
  },
  plugins: [],
};
