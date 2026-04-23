/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],
  allowedDevOrigins: ["10.0.0.73"],
};

export default nextConfig;
