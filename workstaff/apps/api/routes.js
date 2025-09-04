import "dotenv/config";
import { Router } from "express";
import prisma from "./lib/prismaClient.js";
import { supabase } from "../api/lib/supabaseClient.js";
import { supabaseAdmin } from "./lib/supabaseAdmin.js";
import { authMiddleware } from "./middlewares/authMiddleware.js";
import { roleMiddleware } from "./middlewares/roleMiddleware.js";
import multer from "multer";

export const myRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

myRouter.post(
  "/register",
  upload.fields([
    { name: "profilePhoto", maxCount: 1 },
    { name: "dniPhoto", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { role, email, password, fullname, companyName, cif } = req.body;
      const profileFile = req.files["profilePhoto"]?.[0];
      const dniFile = req.files["dniPhoto"]?.[0];

      if (!email || !password || !role) {
        return res.status(400).json({ error: "Faltan datos obligatorios" });
      }

      const { data: authData, error: authError } =
        await supabaseAdmin.auth.signUp({ email, password });

      if (authError || !authData.user) {
        console.error("Error en Supabase Auth:", authError);
        return res
          .status(400)
          .json({ error: authError?.message || "Error creando usuario" });
      }

      const userId = authData.user.id;
      const timestamp = Date.now();
      let profilePhotoUrl = null;
      let dniPhotoUrl = null;

      const profileId = `profile-${timestamp}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const dniId = `dni-${timestamp}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      if (profileFile) {
        const profileExt = profileFile.originalname.split(".").pop();
        const profilePath = `${userId}/profile/${profileId}.${profileExt}`;

        const { error: uploadError } = await supabaseAdmin.storage
          .from("user-documents")
          .upload(profilePath, profileFile.buffer, {
            contentType: profileFile.mimetype,
            upsert: true,
          });

        if (uploadError) throw new Error(uploadError.message);

        const { data: signedUrlData, error: urlError } =
          await supabaseAdmin.storage
            .from("user-documents")
            .createSignedUrl(profilePath, 60 * 60 * 24 * 365 * 10);

        if (urlError) throw new Error(urlError.message);
        profilePhotoUrl = signedUrlData.signedUrl;
      }

      if (dniFile) {
        const dniExt = dniFile.originalname.split(".").pop();
        const dniPath = `${userId}/dni/${dniId}.${dniExt}`;

        const { error: uploadError } = await supabaseAdmin.storage
          .from("user-documents")
          .upload(dniPath, dniFile.buffer, {
            contentType: dniFile.mimetype,
            upsert: true,
          });

        if (uploadError) throw new Error(uploadError.message);

        const { data: signedUrlData, error: urlError } =
          await supabaseAdmin.storage
            .from("user-documents")
            .createSignedUrl(dniPath, 60 * 60 * 24 * 365 * 10);

        if (urlError) throw new Error(urlError.message);
        dniPhotoUrl = signedUrlData.signedUrl;
      }

      const userData = {
        id: userId,
        email,
        role,
        workerProfile:
          role === "WORKER"
            ? {
                create: {
                  fullname,
                  photoUrl: profilePhotoUrl,
                  idPhotoUrl: dniPhotoUrl,
                },
              }
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
      return res
        .status(500)
        .json({ error: err.message || "Error desconocido" });
    }
  }
);

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

myRouter.get(
  "/worker/profile",
  authMiddleware,
  roleMiddleware(["WORKER"]),
  async (req, res) => {
    try {
      const profile = await prisma.workerProfile.findUnique({
        where: { userId: req.appUser.id },
        include: {
          user: { select: { email: true, role: true, id: true } },
          reviews: true,
        },
      });

      if (!profile) {
        return res.status(404).json({ error: "Perfil no encontrado" });
      }

      let signedPhotoUrl = null;
      let signedIdPhotoUrl = null;

      const isFullUrl = (str) =>
        str && (str.startsWith("http") || str.startsWith("https"));

      if (profile.photoUrl) {
        if (isFullUrl(profile.photoUrl)) {
          signedPhotoUrl = profile.photoUrl;
        } else {
          const { data, error } = await supabaseAdmin.storage
            .from("user-documents")
            .createSignedUrl(profile.photoUrl, 60 * 60 * 24 * 365 * 10);

          if (!error) {
            signedPhotoUrl = data.signedUrl;
          }
        }
      }

      if (profile.idPhotoUrl) {
        if (isFullUrl(profile.idPhotoUrl)) {
          signedIdPhotoUrl = profile.idPhotoUrl;
        } else {
          const { data, error } = await supabaseAdmin.storage
            .from("user-documents")
            .createSignedUrl(profile.idPhotoUrl, 60 * 60 * 24 * 365 * 10);

          if (!error) {
            signedIdPhotoUrl = data.signedUrl;
          }
        }
      }

      return res.json({
        ...profile,
        photoUrl: signedPhotoUrl,
        idPhotoUrl: signedIdPhotoUrl,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Error en el servidor" });
    }
  }
);

myRouter.put(
  "/worker/profile",
  authMiddleware,
  roleMiddleware(["WORKER"]),
  async (req, res) => {
    try {
      const {
        fullname,
        experience,
        skills,
        availability,
        certificates,
        rolesExperience,
        workHistory,
        location,
        serviceTypes,
      } = req.body;

      const parseToArray = (val) => {
        if (Array.isArray(val))
          return val.map((v) => String(v).trim()).filter(Boolean);
        if (typeof val === "string") {
          return val
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean);
        }
        return undefined;
      };

      const data = {};
      if (fullname !== undefined) data.fullname = fullname;
      if (experience !== undefined) data.experience = experience;
      if (skills !== undefined) data.skills = parseToArray(skills);
      if (availability !== undefined)
        data.availability = parseToArray(availability);
      if (certificates !== undefined)
        data.certificates = parseToArray(certificates);
      if (rolesExperience !== undefined) data.rolesExperience = rolesExperience;
      if (workHistory !== undefined) data.workHistory = workHistory;
      if (location !== undefined) data.location = location;
      if (serviceTypes !== undefined)
        data.serviceTypes = parseToArray(serviceTypes);

      const updated = await prisma.workerProfile.update({
        where: { userId: req.appUser.id },
        data,
      });

      return res.json({ message: "Perfil actualizado", profile: updated });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Error en el servidor" });
    }
  }
);

myRouter.put(
  "/worker/profile/photo",
  authMiddleware,
  roleMiddleware(["WORKER"]),
  upload.single("photo"),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ error: "No se subió archivo" });

      const timestamp = Date.now();
      const photoId = `profile-update-${timestamp}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const fileExt = req.file.originalname.split(".").pop();
      const fileName = `${req.appUser.id}/profile/${photoId}.${fileExt}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from("user-documents")
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true,
        });

      if (uploadError)
        return res.status(500).json({ error: uploadError.message });

      const { data: signedUrlData, error: urlError } =
        await supabaseAdmin.storage
          .from("user-documents")
          .createSignedUrl(fileName, 60 * 60 * 24 * 365 * 10);

      if (urlError) return res.status(500).json({ error: urlError.message });

      const updated = await prisma.workerProfile.update({
        where: { userId: req.appUser.id },
        data: { photoUrl: signedUrlData.signedUrl },
      });

      return res.json({
        message: "Foto de perfil actualizada",
        profile: updated,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Error en el servidor" });
    }
  }
);

myRouter.put(
  "/worker/profile/id-photo",
  authMiddleware,
  roleMiddleware(["WORKER"]),
  upload.single("idPhoto"),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ error: "No se subió archivo" });

      const timestamp = Date.now();
      const photoId = `dni-update-${timestamp}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const fileExt = req.file.originalname.split(".").pop();
      const fileName = `${req.appUser.id}/dni/${photoId}.${fileExt}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from("user-documents")
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true,
        });

      if (uploadError)
        return res.status(500).json({ error: uploadError.message });

      const { data: signedUrlData, error: urlError } =
        await supabaseAdmin.storage
          .from("user-documents")
          .createSignedUrl(fileName, 60 * 60 * 24 * 365 * 10);

      if (urlError) return res.status(500).json({ error: urlError.message });

      const updated = await prisma.workerProfile.update({
        where: { userId: req.appUser.id },
        data: { idPhotoUrl: signedUrlData.signedUrl },
      });

      return res.json({
        message: "Foto de DNI actualizada",
        profile: updated,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Error en el servidor" });
    }
  }
);