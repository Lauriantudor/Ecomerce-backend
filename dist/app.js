import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import userRouter from "./src/routes/userRoute.js";
import categoryRouter from "./src/routes/categoryRoute.js";
import productRouter from "./src/routes/productRoute.js";
import path from "path";
const app = express();
const PORT = process.env.PORT;
app.use(express.json());
app.use(cookieParser());
app.use("/users", userRouter);
app.use("/categories", categoryRouter);
app.use("/products", productRouter);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.listen(PORT, () => {
    console.log(`Server is actively running on port ${PORT}`);
});
export default app;
