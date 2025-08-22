import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import morgan from 'morgan';
import Dbconnect from './src/config/dbConnect.js';
import ErrorHandler, { errorMiddleware } from './src/utils/error.js';

// Read swagger JSON using fs
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const swaggerPath = path.join(__dirname, 'swagger-output.json');
const swaggerDocument = JSON.parse(fs.readFileSync(swaggerPath, 'utf-8'));

// Initialize Express
const app = express();

app.use(morgan('dev'));
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true, // if using cookies
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Swagger docs route
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Database connection
Dbconnect();

// Test route
app.get('/', (req, res) => {
  res.status(200).json({ status: 'Success' });
});

// Force error route for testing
app.get('/test-error', (req, res, next) => {
  next(new ErrorHandler('Forced test error', 418));
});

// Error handling middleware
app.use(errorMiddleware);

// Start server
const Port = process.env.PORT || 3000;
app.listen(Port, () => {
  console.log(`Server Started: http://localhost:${Port}`);
});
