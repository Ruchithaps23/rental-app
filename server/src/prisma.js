import { PrismaClient } from "@prisma/client";

// One connection object, reused everywhere in the app
const prisma = new PrismaClient();

export default prisma;