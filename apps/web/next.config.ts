import { join } from "path";
import dotenv from "dotenv";
import type { NextConfig } from "next";

dotenv.config({
  path: join(__dirname, "..", "..", ".env"),
});

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
