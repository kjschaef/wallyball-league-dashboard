/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx,mdx}',
    './pages/**/*.{ts,tsx,mdx}',
    './components/**/*.{ts,tsx,mdx}',
    './layout.tsx',
    './page.tsx'
  ],
  theme: {
    extend: {
      colors: {
        'cfa-red': {
          DEFAULT: '#E60026',
          50: '#FFE8ED',
          100: '#FFD1DB',
          200: '#FFA3B7',
          300: '#FF7593',
          400: '#FF476F',
          500: '#FF1A4D',
          600: '#E60026',
          700: '#B8001F',
          800: '#8A0017',
          900: '#5C0010',
          950: '#2E0008'
        },
        'cfa-yellow': {
          DEFAULT: '#FFC300',
          50: '#FFFBCC',
          100: '#FFF799',
          200: '#FFEF66',
          300: '#FFE733',
          400: '#FFDF00',
          500: '#FFC300',
          600: '#CC9C00',
          700: '#997500',
          800: '#664E00',
          900: '#332700',
          950: '#1A1400'
        },
        'cfa-orange': '#FF6B35',
        'cfa-green': '#00B140',
        'cfa-blue': '#0066CC',
        'cfa-cream': '#FBF9F7',
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
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      fontFamily: {
        'inter': ['Inter', 'system-ui', 'sans-serif'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        'cfa': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'cfa-lg': '0 4px 16px rgba(0, 0, 0, 0.12)',
        'cfa-xl': '0 8px 32px rgba(0, 0, 0, 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 0.6s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
          '40%': { transform: 'translateY(-3px)' },
          '60%': { transform: 'translateY(-2px)' },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}