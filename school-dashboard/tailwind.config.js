/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
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
    plugins: [],
}; 
