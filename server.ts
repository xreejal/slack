import express, { Express } from "express";
import dotenv from "dotenv";
import routes from "./routes";

dotenv.config();

const app: Express = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

// Middleware
app.use(express.json());
app.use("/", routes);

// Port setup
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
