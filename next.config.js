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
    serverExternalPackages: [
        '@genkit-ai/core',
        'genkit',
        'genkitx-ollama',
        'genkitx-openai',
        '@genkit-ai/googleai',
        'require-in-the-middle'
    ],
    output: 'standalone',
    // Include docs folder for standalone builds
    outputFileTracingIncludes: {
        '/docs': ['./docs/**/*'],
        '/docs/*': ['./docs/**/*'],
    },
};

module.exports = nextConfig;
