import express, { Application, Request, Response } from "express";
import { router as userRoutes } from "./routes/users.routes";
import { router as uploadRoutes } from "./routes/upload.routes";
import { router as raiderRoutes } from "./routes/raider.routes";
import bodyParser from "body-parser";
import cors from "cors";

export const app:Application = express();

app.use(cors());
app.use(bodyParser.json());

app.get("/", (req:Request, res:Response) => {
  res.send("API is running...");
});

app.use("/users", userRoutes);
app.use("/raiders", raiderRoutes);
app.use("/uploads", uploadRoutes);