/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                'custom-red': '#760D08',
                'custom-red-trans': '#760D0880',
                'custom-black': '#393939',
                'custom-blue': '#38B6FF',
                'custom-blue-trans': '#38B6FF80',
                'custom-grey': '#3A3A3A',
                'custom-light-grey': '#e1e1e1',
                'custom-off-white': '#ededed',
            },
            fontFamily: {
                'radnika': ['radnika_next', 'system-ui', 'sans-serif'],
            },
            boxShadow: {
                'custom': '0 12px 24px 0 rgba(0,0,0,0.09)',
            },
            maxWidth: {
                'custom': '90%',
            },
        },
    },
    plugins: [require("daisyui")],
    daisyui: {
        themes: [
            {
                "ncujhs-light": {
                    "primary": "#38B6FF",        // custom-blue
                    "primary-content": "#ffffff",
                    "secondary": "#760D08",      // custom-red
                    "secondary-content": "#ffffff",
                    "accent": "#38B6FF",         // custom-blue for accents
                    "accent-content": "#ffffff",
                    "neutral": "#393939",        // custom-black
                    "neutral-content": "#ffffff",
                    "base-100": "#ffffff",       // white background
                    "base-200": "#ededed",       // custom-off-white
                    "base-300": "#e1e1e1",       // custom-light-grey
                    "base-content": "#0a0a0a",   // text color from CSS vars
                    "info": "#38B6FF",
                    "success": "#00ff00",
                    "warning": "#ffff00",
                    "error": "#760D08",
                },
                "ncujhs-dark": {
                    "primary": "#38B6FF",        // custom-blue
                    "primary-content": "#ffffff",
                    "secondary": "#760D08",      // custom-red
                    "secondary-content": "#ffffff",
                    "accent": "#38B6FF",         // custom-blue for accents
                    "accent-content": "#ffffff",
                    "neutral": "#393939",        // custom-black
                    "neutral-content": "#ffffff",
                    "base-100": "rgba(0,0,0,0.9)", // dark background from CSS vars
                    "base-200": "#1a1a1a",      // darker variant
                    "base-300": "#2a2a2a",      // darker variant  
                    "base-content": "#dcdcdc",   // text color from CSS vars
                    "info": "#38B6FF",
                    "success": "#00ff00",
                    "warning": "#ffff00",
                    "error": "#760D08",
                }
            }
        ],
    },
}; 
