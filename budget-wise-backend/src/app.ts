import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { router as authRouter } from "./routes/auth";
import { router as groupsRouter } from "./routes/groups";
import { router as expensesRouter } from "./routes/expenses";
import { router as balancesRouter } from "./routes/balances";
import { router as trackingRouter } from "./routes/tracking";
import { router as settlementsRouter } from "./routes/settlements";
import { router as userRouter } from "./routes/user";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/groups", groupsRouter);
app.use("/api/expenses", expensesRouter);
app.use("/api/balances", balancesRouter);
app.use("/api/tracking", trackingRouter);
app.use("/api/settlements", settlementsRouter);
app.use("/api/user", userRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`BudgetWise backend running on http://localhost:${PORT}`);
});
