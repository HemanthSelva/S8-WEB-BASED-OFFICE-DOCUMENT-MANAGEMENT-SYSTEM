import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('Redis connection retries exhausted');
        return new Error('Redis connection retries exhausted');
      }
      const delay = Math.min(retries * 100, 3000);
      console.log(`Redis connection lost. Retrying in ${delay}ms...`);
      return delay;
    }
  }
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

(async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log('Connected to Redis');
  }
})();

export default redisClient;
