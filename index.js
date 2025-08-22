import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import cookieParser from 'cookie-parser';

import swaggerUi from 'swagger-ui-express';
import swaggerDocument  from'./swagger-output.json' assert { type: 'json' };
import morgan from 'morgan';
import Dbconnect from './src/config/dbConnect.js';
import ErrorHandler, { errorMiddleware } from './src/utils/error.js';




const app=express();
app.use(morgan('dev'));
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true, // if using cookies
}));
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());



app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
const Port=process.env.PORT
Dbconnect()

app.get('/', (req, res) => {
  res.status(200).json({
    "status":"Success"
  });;
});


app.get("/test-error", (req, res, next) => {
  next(new ErrorHandler("Forced test error", 418));
});





app.use(errorMiddleware)
app.listen(Port,()=>{
  console.log(`Server Started :http://localhost:${Port} `);
  
})