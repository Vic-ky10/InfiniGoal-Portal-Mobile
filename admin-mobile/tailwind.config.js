/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this content array if you add files in other directories
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
};
