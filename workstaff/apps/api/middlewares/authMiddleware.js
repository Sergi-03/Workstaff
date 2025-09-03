import { supabase } from "../lib/supabaseClient.js";
import prisma from "../lib/prismaClient.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
    if (!token) return res.status(401).json({ error: "Token no proporcionado" });

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: "Token inválido o expirado" });
    }

    const appUser = await prisma.user.findUnique({
      where: { id: data.user.id },
      select: { id: true, email: true, role: true },
    });

    if (!appUser) return res.status(404).json({ error: "Usuario no encontrado en DB" });

    req.supabaseUser = data.user;
    req.appUser = appUser;
    next();
  } catch (err) {
    return res.status(500).json({ error: "Error de autenticación" });
  }
};