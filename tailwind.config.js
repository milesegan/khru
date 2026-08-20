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
        sans: [
          '"Atkinson Hyperlegible Next"',
          '"Sarabun"',
          '"Segoe UI"',
          "sans-serif",
        ],
        serif: ['"Fraunces"', '"Sarabun"', "Georgia", "serif"],
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
        // Sampled from a damped spring so the browser only has to interpolate
        // between closely spaced stops. Timing must stay `linear` -- an easing
        // curve would be re-applied to every segment and reintroduce the steps.
        "known-word-pulse": {
          "0%": { transform: "scale(1)" },
          "5%": { transform: "scale(1.127)" },
          "10%": { transform: "scale(1.16)" },
          "15%": { transform: "scale(1.129)" },
          "20%": { transform: "scale(1.07)" },
          "25%": { transform: "scale(1.014)" },
          "30%": { transform: "scale(0.991)" },
          "35%": { transform: "scale(0.985)" },
          "42%": { transform: "scale(0.99)" },
          "50%": { transform: "scale(0.997)" },
          "60%": { transform: "scale(1.008)" },
          "70%": { transform: "scale(1.006)" },
          "82%": { transform: "scale(0.999)" },
          "100%": { transform: "scale(1)" },
        },
        "known-support-pulse": {
          "0%": { transform: "scale(1)" },
          "8%": { transform: "scale(1.035)" },
          "17%": { transform: "scale(1.028)" },
          "25%": { transform: "scale(1.01)" },
          "35%": { transform: "scale(0.998)" },
          "55%": { transform: "scale(1)" },
          "100%": { transform: "scale(1)" },
        },
        "known-glow-bloom": {
          "0%": { opacity: "0", transform: "scale(0.82)" },
          "12%": { opacity: "1", transform: "scale(1.02)" },
          "40%": { opacity: "0.55", transform: "scale(1.06)" },
          "100%": { opacity: "0", transform: "scale(1.12)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out forwards",
        "known-word-pulse": "known-word-pulse 0.62s linear",
        "known-support-pulse": "known-support-pulse 0.62s linear",
        "known-glow-bloom": "known-glow-bloom 0.62s ease-out both",
      },
    },
  },
  plugins: [],
};
