/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'picsum.photos',
            },
        ],
    },
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
    },
    output: 'standalone'
};

module.exports = nextConfig;
