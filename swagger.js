// swagger.js
import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: {
    title: 'RoomSathi API',
    description: 'API Documentation',
  },
  host: 'room-sathi-backend.onrender.com', 
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['./index.js']; // or your main route files

swaggerAutogen()(outputFile, endpointsFiles, doc);
