import { Theme } from "@openauthjs/openauth/ui/theme";

const theme: Theme = {
  primary: "hsl(224, 100%, 79%)",
  background: "hsl(224, 10%, 10%)",
  title: "blank",
  radius: "none",
  css: `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap');

[data-component="button"] {
  font-weight: 500 !important;
  text-transform: uppercase !important;
  border: 1px solid hsl(224, 35%, 90%) !important;
  background-color: hsl(224, 10%, 10%) !important;
}

[data-component="button"]:hover {
  background-color: hsl(224, 3.7%, 15.9%) !important;
}

p, input { text-transform: lowercase }

[data-component="logo"] {
  height: 5.5rem;
}
`.trim(),
  font: {
    family: "IBM Plex Mono",
  },
  logo: "https://raw.githubusercontent.com/jackbisceglia/blank/refs/heads/main/blank-text-logo.png",
};

export default theme;
