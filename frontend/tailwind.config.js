/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Gaming dark mode palette
                'dark': {
                    900: '#0a0e27',
                    800: '#0f1729',
                    700: '#1a1f3a',
                    600: '#252b48',
                    500: '#2d3454',
                },
                'gold': {
                    400: '#f0b90b',
                    500: '#d4a017',
                    600: '#b8860b',
                },
                'cyan': {
                    400: '#00d9ff',
                    500: '#00b8d4',
                    600: '#0097a7',
                },
                'purple': {
                    400: '#a855f7',
                    500: '#9333ea',
                    600: '#7e22ce',
                },
                'neon': {
                    blue: '#00f0ff',
                    purple: '#bf00ff',
                    pink: '#ff00e5',
                },
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-gaming': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                'gradient-gold': 'linear-gradient(135deg, #f0b90b 0%, #d4a017 100%)',
                'gradient-cyan': 'linear-gradient(135deg, #00d9ff 0%, #0097a7 100%)',
            },
            boxShadow: {
                'glow-gold': '0 0 20px rgba(240, 185, 11, 0.5)',
                'glow-cyan': '0 0 20px rgba(0, 217, 255, 0.5)',
                'glow-purple': '0 0 20px rgba(168, 85, 247, 0.5)',
                'inner-glow': 'inset 0 0 20px rgba(255, 255, 255, 0.1)',
            },
            animation: {
                'glow': 'glow 2s ease-in-out infinite alternate',
                'float': 'float 3s ease-in-out infinite',
                'slide-up': 'slideUp 0.3s ease-out',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                glow: {
                    '0%': { boxShadow: '0 0 5px rgba(240, 185, 11, 0.5)' },
                    '100%': { boxShadow: '0 0 20px rgba(240, 185, 11, 0.8)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            },
        },
    },
    plugins: [],
}
