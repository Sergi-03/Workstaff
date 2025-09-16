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
    { name: "logo", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { role, email, password, fullname, companyName, cif } = req.body;
      const profileFile = req.files["profilePhoto"]?.[0];
      const dniFile = req.files["dniPhoto"]?.[0];
      const logoFile = req.files["logo"]?.[0];

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
      let logoUrl = null;

      if (logoFile) {
        const logoExt = logoFile.originalname.split(".").pop();
        const logoId = `logo-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        const logoPath = `${userId}/logo/${logoId}.${logoExt}`;

        const { error: uploadError } = await supabaseAdmin.storage
          .from("user-documents")
          .upload(logoPath, logoFile.buffer, {
            contentType: logoFile.mimetype,
            upsert: true,
          });

        if (uploadError) throw new Error(uploadError.message);

        const { data: signedUrlData, error: urlError } =
          await supabaseAdmin.storage
            .from("user-documents")
            .createSignedUrl(logoPath, 60 * 60 * 24 * 365 * 10);

        if (urlError) throw new Error(urlError.message);
        logoUrl = signedUrlData.signedUrl;
      }

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
            ? {
                create: { name: companyName, contactInfo: email, cif, logoUrl },
              }
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

myRouter.put("/change-password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Contraseña actual y nueva son obligatorias" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: "La nueva contraseña debe tener al menos 6 caracteres",
      });
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: req.appUser.email,
      password: currentPassword,
    });

    if (signInError) {
      return res.status(400).json({ error: "Contraseña actual incorrecta" });
    }

    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(req.appUser.id, {
        password: newPassword,
      });

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    return res.json({ message: "Contraseña actualizada correctamente" });
  } catch (err) {
    console.error("Error cambiando contraseña:", err);
    return res.status(500).json({ error: "Error en el servidor" });
  }
});

myRouter.put("/change-email", authMiddleware, async (req, res) => {
  try {
    const { newEmail } = req.body;

    if (!newEmail || !newEmail.includes("@")) {
      return res.status(400).json({ error: "Email inválido" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: newEmail.toLowerCase() },
    });

    if (existingUser && existingUser.id !== req.appUser.id) {
      return res.status(400).json({ error: "Este email ya está en uso" });
    }

    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(req.appUser.id, {
        email: newEmail.toLowerCase(),
      });

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    await prisma.user.update({
      where: { id: req.appUser.id },
      data: { email: newEmail.toLowerCase() },
    });

    if (req.appUser.role === "COMPANY") {
      await prisma.companyProfile.update({
        where: { userId: req.appUser.id },
        data: { contactInfo: newEmail.toLowerCase() },
      });
    }

    return res.json({
      message: "Email actualizado correctamente",
      email: newEmail.toLowerCase(),
    });
  } catch (err) {
    console.error("Error cambiando email:", err);
    return res.status(500).json({ error: "Error en el servidor" });
  }
});

myRouter.delete("/delete-account", authMiddleware, async (req, res) => {
  try {
    const userId = req.appUser.id;

    const { data: files, error: listError } = await supabaseAdmin.storage
      .from("user-documents")
      .list(userId);

    if (!listError && files && files.length > 0) {
      const filePaths = files.map((file) => `${userId}/${file.name}`);
      await supabaseAdmin.storage.from("user-documents").remove(filePaths);

      const subfolders = ["profile", "dni", "logo"];
      for (const folder of subfolders) {
        const { data: folderFiles } = await supabaseAdmin.storage
          .from("user-documents")
          .list(`${userId}/${folder}`);

        if (folderFiles && folderFiles.length > 0) {
          const folderFilePaths = folderFiles.map(
            (file) => `${userId}/${folder}/${file.name}`
          );
          await supabaseAdmin.storage
            .from("user-documents")
            .remove(folderFilePaths);
        }
      }
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    const { error: deleteAuthError } =
      await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteAuthError) {
      console.error(
        "Error eliminando usuario de Supabase Auth:",
        deleteAuthError
      );
    }

    return res.json({ message: "Cuenta eliminada correctamente" });
  } catch (err) {
    console.error("Error eliminando cuenta:", err);
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

myRouter.get(
  "/company/profile",
  authMiddleware,
  roleMiddleware(["COMPANY"]),
  async (req, res) => {
    try {
      const profile = await prisma.companyProfile.findUnique({
        where: { userId: req.appUser.id },
        include: {
          user: { select: { email: true, role: true, id: true } },
          jobs: true,
          contracts: true,
        },
      });

      if (!profile) {
        return res
          .status(404)
          .json({ error: "Perfil de empresa no encontrado" });
      }

      let signedLogoUrl = null;

      const isFullUrl = (str) =>
        str && (str.startsWith("http") || str.startsWith("https"));

      if (profile.logoUrl) {
        if (isFullUrl(profile.logoUrl)) {
          signedLogoUrl = profile.logoUrl;
        } else {
          const { data, error } = await supabaseAdmin.storage
            .from("user-documents")
            .createSignedUrl(profile.logoUrl, 60 * 60 * 24 * 365 * 10);

          if (!error) signedLogoUrl = data.signedUrl;
        }
      }

      return res.json({
        ...profile,
        logoUrl: signedLogoUrl,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Error en el servidor" });
    }
  }
);

myRouter.put(
  "/company/profile",
  authMiddleware,
  roleMiddleware(["COMPANY"]),
  async (req, res) => {
    try {
      const { name, cif, contactInfo } = req.body;

      const updatedProfile = await prisma.companyProfile.update({
        where: { userId: req.appUser.id },
        data: {
          name,
          cif,
          contactInfo,
        },
      });

      return res.json(updatedProfile);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Error en el servidor" });
    }
  }
);

myRouter.put(
  "/company/profile/logo",
  authMiddleware,
  roleMiddleware(["COMPANY"]),
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No se envió ningún archivo" });
      }

      const timestamp = Date.now();
      const logoId = `logo-update-${timestamp}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const fileExt = req.file.originalname.split(".").pop();
      const filePath = `${req.appUser.id}/logo/${logoId}.${fileExt}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from("user-documents")
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true,
        });

      if (uploadError) {
        console.error(uploadError);
        return res.status(500).json({ error: "Error al subir el logo" });
      }

      const { data: signedUrlData, error: urlError } =
        await supabaseAdmin.storage
          .from("user-documents")
          .createSignedUrl(filePath, 60 * 60 * 24 * 365 * 10);

      if (urlError) {
        return res.status(500).json({ error: urlError.message });
      }

      await prisma.companyProfile.update({
        where: { userId: req.appUser.id },
        data: { logoUrl: signedUrlData.signedUrl },
      });

      return res.json({
        message: "Logo actualizado correctamente",
        logoUrl: signedUrlData.signedUrl,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Error en el servidor" });
    }
  }
);