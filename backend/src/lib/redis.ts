import { Redis } from "ioredis";

const redis = new Redis("rediss://default:AYZ6AAIncDI0OTYzMGI4MjBhY2U0ODQzOTA5OTE4YTQ4ZjlhNmI1MXAyMzQ0MjY@rested-marlin-34426.upstash.io:6379");

redis.on("connect", () => console.log("✅ Redis connected"));
redis.on("error", (err) => console.error("❌ Redis error", err));

export default redis;