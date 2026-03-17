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
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out forwards",
      },
    },
  },
  plugins: [],
};
