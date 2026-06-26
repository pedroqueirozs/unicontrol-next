/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        /* Backgrounds */
        background: "hsl(var(--background))",
        background_primary_500: "hsl(var(--background-primary-500))",
        background_primary_400: "hsl(var(--background-primary-400))",
        background_white: "hsl(var(--background-white))",

        /* Textos */
        text_primary_500: "hsl(var(--text-primary-500))",
        text_primary_400: "hsl(var(--text-primary-400))",
        text_primary_300: "hsl(var(--text-primary-300))",

        text_secondary: "hsl(var(--text-secondary))",
        text_white: "hsl(var(--text-white))",
        neutral: "hsl(var(--neutral))",

        /* Details */
        details_green: "hsl(var(--details-green))",
        details_red: "hsl(var(--details-red))",

        /* Inputs */
        input_bg: "hsl(var(--input-bg))",
        input_border: "hsl(var(--input-border))",
        input_border_focus: "hsl(var(--input-border-focus))",

        input_text_icon: "hsl(var(--input-text-icon))",
        input_bg_icon: "hsl(var(--input-bg-icon))",

        /* Notificações */
        notification_error: "hsl(var(--notification-error))",
        notification_success: "hsl(var(--notification-success))",
        notification_warn: "hsl(var(--notification-warn))",

        /* Status */
        color_success: "#2ECC71",
        color_info: "#34D399",
        color_error: "#E74C3C",
      },
    },
  },
  plugins: [],
};
