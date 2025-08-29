import "dotenv/config";
import { Router } from "express";
import prisma from "../../lib/prismaClient.js";
import { supabase } from "../api/lib/supabaseClient.js";
import multer from "multer";

export const myRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

myRouter.post("/register", upload.single("photo"), async (req, res) => {
  try {
    const { role, email, password, fullname, companyName, cif } = req.body;
    const file = req.file;

    if (!email || !password || !role) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      console.error("Error en Supabase Auth:", authError);
      return res
        .status(400)
        .json({ error: authError?.message || "Error creando usuario" });
    }

    const userId = authData.user.id;

    let photoUrl = null;
    if (role === "WORKER") {
      if (!file)
        return res.status(400).json({ error: "Debes subir una foto/DNI" });

      const fileExt = file.originalname.split(".").pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("user-documents")
        .upload(fileName, file.buffer, { contentType: file.mimetype });

      if (uploadError) {
        console.error("Error subiendo archivo:", uploadError);
        return res.status(500).json({ error: uploadError.message });
      }

      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from("user-documents")
        .createSignedUrl(fileName, 3600);

      if (urlError) {
        console.error("Error creando signed URL:", urlError);
        return res.status(500).json({ error: urlError.message });
      }

      photoUrl = signedUrlData.signedUrl;
    }

    const userData = {
      id: userId,
      email,
      role,
      workerProfile:
        role === "WORKER"
          ? { create: { fullname, photoUrl, idPhotoUrl: photoUrl } }
          : undefined,
      companyProfile:
        role === "COMPANY"
          ? { create: { name: companyName, contactInfo: email, cif } }
          : undefined,
    };

    await prisma.user.create({ data: userData });

    return res
      .status(200)
      .json({ message: "Usuario registrado correctamente!" });
  } catch (err) {
    console.error("Error desconocido:", err);
    return res.status(500).json({ error: err.message || "Error desconocido" });
  }
});

myRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email y contraseña son obligatorios" });
    }

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError || !authData.session) {
      console.error("Error en login Supabase:", authError);
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const userId = authData.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        email: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado en DB" });
    }

    return res.json({
      message: "Login exitoso",
      token: authData.session.access_token,
      role: user.role,
      userId: user.id,
    });
  } catch (err) {
    console.error("Error en login:", err);
    return res.status(500).json({ error: err.message || "Error desconocido" });
  }
});

myRouter.post("/forgot-password", async (req, res) => {
  try {
    const raw = (req.body?.email || "").trim();
    if (!raw) return res.status(400).json({ error: "Email obligatorio" });

    const email = raw.toLowerCase();

    const exists = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!exists) {
      return res.status(404).json({ error: "El correo no existe" });
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://workstaff-three.vercel.app/reset-password",
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json({
      message: "Revisa tu correo para restablecer la contraseña",
    });
  } catch (err) {
    return res.status(500).json({ error: "Error en el servidor" });
  }
});

myRouter.post("/reset-password", async (req, res) => {
  try {
    const { access_token, newPassword } = req.body;

    if (!access_token || !newPassword) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "La contraseña debe tener mínimo 6 caracteres" });
    }

    const { error } = await supabase.auth.api.updateUserByResetToken(
      access_token,
      { password: newPassword }
    );

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json({ message: "Contraseña cambiada correctamente" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error en el servidor" });
  }
});