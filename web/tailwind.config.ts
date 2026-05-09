import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/pages/**/*.{js,ts,jsx,tsx,mdx}", "./src/components/**/*.{js,ts,jsx,tsx,mdx}", "./src/app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        neon: {
          /** Matches logo: deeper teal “Nexus” side */
          nexus: "#148896",
          /** Bright cyan “Stream” accent */
          stream: "#35f0ff",
          deep: "#060d1a",
          violet: "#8b7bff",
          cyan: "#22f6ff",
          mint: "#3cffb4",
          fuchsia: "#c084fc",
          void: "#050712",
          glass: "rgba(10, 22, 42, 0.62)",
        },
      },
      fontFamily: {
        display: ["var(--font-syne)", "system-ui"],
        mono: ["var(--font-geist-mono)", "ui-monospace"],
      },
      backgroundImage: {
        "neon-grid":
          "linear-gradient(148deg,rgba(20,136,150,0.09),rgba(139,123,255,0.07)),radial-gradient(ellipse at 25% 15%,rgba(53,240,255,0.14),transparent 48%),radial-gradient(ellipse at 85% 80%,rgba(106,92,255,0.1),transparent 42%),linear-gradient(#060d1a,#050712)",
        shimmer: "linear-gradient(115deg,rgba(34,246,255,0.25),transparent 40%,rgba(255,60,245,0.25))",
      },
      boxShadow: {
        neon: "0 0 36px rgba(53,240,255,0.32), inset 0 0 52px rgba(139,123,255,0.1)",
      },
      animation: {
        pulseGlow: "pulseGlow 4s ease-in-out infinite",
        drift: "drift 22s linear infinite",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { opacity: "0.45" },
          "50%": { opacity: "0.95" },
        },
        drift: {
          "0%": { transform: "translate3d(0,0,0)" },
          "100%": { transform: "translate3d(-120px,-60px,0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
