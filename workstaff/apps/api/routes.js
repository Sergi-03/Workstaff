import { Router } from "express";
import prisma from "../../lib/prismaClient";

export const myRouter = Router();

myRouter.get("/", async (req, res, next) => {
res.json({message:"Funciona"})
})