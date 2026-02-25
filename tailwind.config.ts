import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Hago Produce Design Tokens
        "hago-primary": {
          900: "#1B5E20",
          800: "#2E7D32",
          700: "#388E3C",
          600: "#43A047",
          500: "#4CAF50",
          100: "#C8E6C9",
          50: "#E8F5E9",
        },
        "hago-secondary": {
          900: "#E65100",
          800: "#FF6F00",
          700: "#FF8F00",
          600: "#FFA000",
          500: "#FFB300",
          100: "#FFE0B2",
          50: "#FFF3E0",
        },
        "hago-gray": {
          900: "#212121",
          800: "#424242",
          700: "#616161",
          600: "#757575",
          500: "#9E9E9E",
          400: "#BDBDBD",
          300: "#E0E0E0",
          200: "#EEEEEE",
          100: "#F5F5F5",
          50: "#FAFAFA",
        },
        "hago-success": "#4CAF50",
        "hago-warning": "#FF9800",
        "hago-error": "#F44336",
        "hago-info": "#2196F3",
        "hago-whatsapp": "#25D366",
        "hago-telegram": "#0088CC",
        "hago-email": "#1976D2",
        "hago-make": "#6B2CF5",
        // shadcn compatibility
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
    },
  },
  plugins: [],
};
export default config;
