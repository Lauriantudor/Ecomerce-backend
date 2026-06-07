import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import "dotenv/config";
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    throw new Error("DATABASE_URL is not defined");
}
const prisma = new PrismaClient({
    adapter: new PrismaMariaDb(databaseUrl),
});
export default prisma;
