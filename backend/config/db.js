import { connect } from "mongoose";

export const connectDB = async () => {
    await connect(process.env.DB_URL)
        .then(() => console.log("DB CONNECTED"));
}