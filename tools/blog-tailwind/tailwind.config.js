/** Build: from the repo root run
 *    npx tailwindcss@3.4.17 -c tools/blog-tailwind/tailwind.config.js -i tools/blog-tailwind/input.css -o css/blog-tw.css --minify
 * Re-run after changing class names in blog.html or js/blog.js. */
module.exports = {
  content: ["./blog.html", "./js/blog.js"],
  theme: {
    extend: {
      colors: {
        "brand-bg": "#FDFBF7", "brand-dark": "#0F2218", "brand-accent": "#D4AF37",
        "brand-sec": "#E8E6E1", "brand-text": "#1F2937",
      },
      fontFamily: { sans: ["Outfit", "sans-serif"], serif: ["Playfair Display", "serif"] },
      animation: { ticker: "ticker 40s linear infinite", "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite" },
      keyframes: { ticker: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } } },
    },
  },
  plugins: [],
};
