import express from "express"
import cors from "cors"

import { config } from "dotenv";
import { connectDB } from "./config/db.js";

import userRouter from './routes/userRoute.js';
import incomeRouter from "./routes/incomeRoute.js";
import expenseRouter from "./routes/expenseRoute.js";
import dashboardRouter from "./routes/dashboardRoute.js";

config();

const app = express();

// MIDDLEWARES
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


//DB
connectDB();


//ROUTES
app.use('/api/user', userRouter);
app.use('/api/income', incomeRouter);
app.use('/api/expense', expenseRouter);
app.use('/api/dashboard', dashboardRouter);

app.get('/', (req, res) => {
    res.send("API IS WORKING")
})


app.listen(process.env.PORT || 5001, () => {
    console.log(`Application running on http://localhost:${process.env.PORT}`)
})