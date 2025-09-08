/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eefaff",
          100: "#d9f2ff",
          200: "#b5e6ff",
          300: "#83d8ff",
          400: "#42c2ff",
          500: "#0ea5e9",   /* primaire */
          600: "#0b83bd",
          700: "#0a6a99",
          800: "#0a5479",
          900: "#0b4563"
        },
        accent: "#22c55e"   /* vert succès */
      },
      boxShadow: {
        soft: "0 10px 30px -12px rgba(0,0,0,.25)"
      },
      borderRadius: {
        xl2: "1rem",
      }
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms"),
    require("@tailwindcss/aspect-ratio")
  ],
}
