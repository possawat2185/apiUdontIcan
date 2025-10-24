import express, { Application, Request, Response } from "express";
import { router as userRoutes } from "./routes/users.routes";
import { router as uploadRoutes } from "./routes/upload.routes";
import { router as riderRoutes } from "./routes/rider.routes";
import { router as deliveryJobRoutes } from "./routes/deliveryJob.route";
import { router as addressRoutes } from "./routes/address.route";
import bodyParser from "body-parser";
import cors from "cors";

export const app:Application = express();

app.use(cors());
app.use(bodyParser.json());

app.get("/", (req:Request, res:Response) => {
  res.send("API is running...");
});

app.use("/users", userRoutes);
app.use("/riders", riderRoutes);
app.use("/jobs", deliveryJobRoutes)
app.use("/addresses", addressRoutes)
app.use("/uploads", uploadRoutes);