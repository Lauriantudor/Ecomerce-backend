import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import userRouter from "./src/routes/userRoute.ts";
import categoryRouter from "./src/routes/categoryRoute.ts";
import productRouter from "./src/routes/productRoute.ts";
import cartRouter from "./src/routes/cartRoute.ts";
import orderRouter from "./src/routes/orderRoute.ts";
import addressRouter from "./src/routes/adressRoute.ts";

import path from "path";

const app = express();
const PORT = process.env.PORT;
app.use(express.json());
app.use(cookieParser());

app.use("/users", userRouter);
app.use("/categories", categoryRouter);
app.use("/products", productRouter);
app.use("/cart", cartRouter);
app.use("/orders", orderRouter);
app.use("/addresses", addressRouter);

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.listen(PORT, () => {
  console.log(`Server is actively running on port ${PORT}`);
});
export default app;
