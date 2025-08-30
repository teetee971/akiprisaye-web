/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#e6f6ff",
          100: "#ccecff",
          200: "#99daff",
          300: "#66c7ff",
          400: "#33b5ff",
          500: "#00a2ff",
          600: "#0082cc",
          700: "#006399",
          800: "#004466",
          900: "#002433",
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "Arial", "sans-serif"]
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,0.35)"
      }
    },
  },
  plugins: [],
}
