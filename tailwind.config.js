/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        custom: "#414651",
        secondary: "#181D27",
        lightGray: "#535862",
        darkGray: "#444",
        cloudGray: "#E9EAEB",
        charcoal: "#414651",
        primary: "#0352FD",
        white: "#ffffff",
        neutral: {
          900: "#000000",
          700: "#444444",
          500: "#888888",
          300: "#AAAAAA",
          200: "#CCCCCC",
          100: "#EEEEEE",
        },
        green: {
          100: "#D9FFD9",
          500: "#37BF37",
          700: "#159215",
        },
        blue: {
          500: "#0352FD",
          300: "#286CFF",
          200: "#a2cfff", // example lighter shade
          100: "#d9ebff",
        },
        yellow: {
          100: "#FFF1D7",
          500: "#E69500",
        },
        stormGray: "#717680",
        brand: {
          solid: "#414651",
          solid_hover: "#252B37",
        },
        error: {
          solid: "#EF4444",
          primary: "#B91C1C",
          rose: "#FEF3F2",
        },
        disabled: {
          subtle: "#D5D7DA",
        },
      },
      fontFamily: {
        inter: ["Inter", "sans-serif"],
        // Figma primitive Typo.Family. Prefer `font-sans-headline`; keep
        // `font-stack` as a legacy alias for older Fleet/Claims work.
        "sans-headline": ["'Stack Sans Headline'", "sans-serif"],
        stack: ["'Stack Sans Headline'", "sans-serif"],
      },
      // Figma primitive  Typo.Weight -> Tailwind weight utilities (all loaded in index.html):
      //   Light 300 = font-light | Regular 400 = font-normal | Medium 500 = font-medium
      //   SemiBold 600 = font-semibold | Bold 700 = font-bold
      fontWeight: {
        light: "300",
        normal: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
      },
      // Figma primitive  Size (px) — e.g. text-fig-md = 24px. Kept under a `fig-`
      // prefix so Tailwind's own text-sm/lg/... (used across Claims) are untouched.
      fontSize: {
        "fig-xlg": "2.5rem", // 40
        "fig-lg": "2rem", // 32
        "fig-md": "1.5rem", // 24
        "fig-md2": "1.25rem", // 20
        "fig-md3": "1rem", // 16
        "fig-sm": "0.875rem", // 14
        "fig-sm2": "0.75rem", // 12
        "fig-xsm": "0.625rem", // 10
      },
      spacing: {
        0.5: "0.125rem",
        4.5: "1.125rem",
        7: "1.75rem",
      },
      borderRadius: {
        7: "0.4375rem", // for your before:rounded-[7px]
      },
      transitionDuration: {
        100: "100ms",
      },
      transitionTimingFunction: {
        linear: "linear",
      },
    },
  },
  plugins: [],
};
