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
