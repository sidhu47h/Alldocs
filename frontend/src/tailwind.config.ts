import type { Config } from "tailwindcss"
import typography from "@tailwindcss/typography"

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        gray: {
          900: "#111111",
          800: "#1a1a1a",
          700: "#2a2a2a",
        },
        blue: {
          600: "#0070f3",
          700: "#0761d1",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      typography: (theme) => ({
        invert: {
          css: {
            "--tw-prose-body": theme.colors.gray[300],
            "--tw-prose-headings": theme.colors.white,
            "--tw-prose-links": theme.colors.blue[400],
            "--tw-prose-bold": theme.colors.white,
            "--tw-prose-counters": theme.colors.gray[400],
            "--tw-prose-bullets": theme.colors.gray[400],
            "--tw-prose-hr": theme.colors.gray[700],
            "--tw-prose-quote-borders": theme.colors.gray[700],
            "--tw-prose-captions": theme.colors.gray[400],
            "--tw-prose-code": theme.colors.white,
            "--tw-prose-pre-code": theme.colors.gray[300],
            "--tw-prose-pre-bg": theme.colors.gray[900],
            "--tw-prose-th-borders": theme.colors.gray[700],
            "--tw-prose-td-borders": theme.colors.gray[700],
          },
        },
      }),
    },
  },
  plugins: [typography],
}

export default config

