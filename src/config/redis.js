import ".//env.js";
import Redis from 'ioredis';

const redis = new Redis({
  host: 'redis-14963.c305.ap-south-1-1.ec2.redns.redis-cloud.com',
  port: 14963,
  password: process.env.REDIS_PASS,
  
});

// Optional: Logs
redis.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});

export default redis;
