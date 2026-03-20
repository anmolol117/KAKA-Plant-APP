export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        dawn: "#f7dba7",
        grove: "#285943",
        leaf: "#7fb069",
        blossom: "#f4b393",
        dusk: "#cf6f47",
        night: "#102542"
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Manrope", "sans-serif"]
      },
      boxShadow: {
        card: "0 25px 60px rgba(16, 37, 66, 0.16)"
      }
    }
  },
  plugins: []
};
