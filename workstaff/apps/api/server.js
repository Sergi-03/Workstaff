import express from "express";
import cors from "cors"
import { myRouter } from "./routes.js";

const app = express();

app.use(cors());

app.use(express.json());

app.use("/api/auth", myRouter)

const PORT = process.env.PORT ?? 1234;

app.listen(PORT, () => {
    console.log(`Server is running on port:http://localhost:${PORT}`);
});