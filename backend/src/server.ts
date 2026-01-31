import { httpServer } from './app';
import dotenv from 'dotenv';
import prisma from './utils/prisma';
import Logger from './utils/logger';

dotenv.config();

const PORT = parseInt(process.env.PORT || '5000', 10);
const HOST = '0.0.0.0'; // Explicitly bind to all interfaces for Docker

const startServer = async () => {
  try {
    Logger.info('Starting server initialization...');
    
    // Check Database Connection
    await prisma.$connect();
    Logger.info('Database connected successfully');

    // Start Server
    httpServer.listen(PORT, HOST, () => {
      Logger.info(`Server running on http://${HOST}:${PORT}`);
      Logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    Logger.error(`Failed to start server: ${error}`);
    // Allow the process to crash so Docker can restart it
    process.exit(1);
  }
};

startServer();
