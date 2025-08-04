import express, { Express } from "express";
import routes from "./routes";

const app: Express = express();
const port = 3000;

//Middleware
app.use(express.json)
app.use('/', routes)

//Port setup
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
