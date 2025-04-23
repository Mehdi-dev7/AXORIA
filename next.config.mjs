/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "axoriablogéducation12.b-cdn.net",
				pathname: "/**",
			},
		],
	},
};

export default nextConfig;
