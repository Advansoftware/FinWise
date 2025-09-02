/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['tr46', 'whatwg-url'],
    experimental: {
        serverComponentsExternalPackages: [
            '@genkit-ai/core',
            'genkit',
            'genkitx-ollama',
            'genkitx-openai',
            '@genkit-ai/googleai',
            'require-in-the-middle'
        ],
    }
};

module.exports = nextConfig;
