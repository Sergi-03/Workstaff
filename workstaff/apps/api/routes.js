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

    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
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

    if (role === "WORKER") {
      await prisma.user.create({
        data: {
          id: userId,
          email,
          password,
          role,
          workerProfile: {
            create: {
              fullname,
              photoUrl,
              idPhotoUrl: photoUrl,
            },
          },
        },
      });
    } else if (role === "COMPANY") {
      await prisma.user.create({
        data: {
          id: userId,
          email,
          password,
          role,
          companyProfile: {
            create: {
              name: companyName,
              contactInfo: email,
              cif,
            },
          },
        },
      });
    }

    return res
      .status(200)
      .json({ message: "Usuario registrado correctamente!" });
  } catch (err) {
    console.error("Error desconocido:", err);
    return res.status(500).json({ error: err.message || "Error desconocido" });
  }
});
