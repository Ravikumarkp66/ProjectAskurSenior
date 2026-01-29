module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#f5f5f5',
                    100: '#e8e8e8',
                    200: '#d0d0d0',
                    500: '#ff8c00',
                    600: '#ff7700',
                    700: '#ff6600',
                    800: '#1a1a1a',
                    900: '#000000',
                },
                secondary: {
                    500: '#ffffff',
                    600: '#f5f5f5',
                    700: '#e8e8e8',
                },
                dark: {
                    50: '#2a2a2a',
                    100: '#1f1f1f',
                    200: '#1a1a1a',
                },
            },
        },
    },
    plugins: [],
};
