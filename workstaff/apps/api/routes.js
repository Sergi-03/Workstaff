import "dotenv/config";
import { Router } from "express";
import prisma from "./lib/prismaClient.js";
import { supabase } from "../api/lib/supabaseClient.js";
import { supabaseAdmin } from "./lib/supabaseAdmin.js";
import { authMiddleware } from "./middlewares/authMiddleware.js";
import { roleMiddleware } from "./middlewares/roleMiddleware.js";
import multer from "multer";
import speakeasy from "speakeasy";
import QRCode from "qrcode";

export const myRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

function calculateMatchScore(job, worker) {
  const scores = {
    skillsScore: 0,
    locationScore: 0,
    availabilityScore: 0,
    salaryScore: 0,
    experienceScore: 0,
  };

  const matchedSkills = [];
  const missingSkills = [];
  const strengths = [];
  const weaknesses = [];

  if (job.JobSkillRequirement && job.JobSkillRequirement.length > 0) {
    let totalWeight = 0;
    let achievedWeight = 0;

    job.JobSkillRequirement.forEach((req) => {
      totalWeight += req.weight;

      const workerSkill = worker.WorkerSkill?.find(
        (ws) => ws.skillId === req.skillId
      );

      if (workerSkill) {
        const levelValues = {
          BASICO: 1,
          INTERMEDIO: 2,
          AVANZADO: 3,
          EXPERTO: 4,
        };
        const requiredLevel = levelValues[req.minimumLevel] || 1;
        const workerLevel = levelValues[workerSkill.level] || 1;

        if (workerLevel >= requiredLevel) {
          achievedWeight += req.weight;
          matchedSkills.push({
            name: req.Skill.name,
            required: req.minimumLevel,
            has: workerSkill.level,
            weight: req.weight,
          });
        } else {
          missingSkills.push({
            name: req.Skill.name,
            required: req.minimumLevel,
            has: workerSkill.level,
            weight: req.weight,
          });
        }
      } else {
        missingSkills.push({
          name: req.Skill.name,
          required: req.minimumLevel,
          has: null,
          weight: req.weight,
        });
      }
    });

    scores.skillsScore =
      totalWeight > 0 ? (achievedWeight / totalWeight) * 100 : 0;
  }

  if (job.location && worker.location) {
    const jobLoc = job.location.toLowerCase().trim();
    const workerLoc = worker.location.toLowerCase().trim();

    if (jobLoc === workerLoc) {
      scores.locationScore = 100;
      strengths.push("Ubicación exacta");
    } else if (workerLoc.includes(jobLoc) || jobLoc.includes(workerLoc)) {
      scores.locationScore = 70;
      strengths.push("Ubicación cercana");
    } else {
      scores.locationScore = 30;
      weaknesses.push("Ubicación distante");
    }
  } else {
    scores.locationScore = 50;
  }

  const requiredExp = job.minimumYearsExperience || 0;
  const workerExp = worker.totalYearsExperience || 0;

  if (workerExp >= requiredExp * 1.5) {
    scores.experienceScore = 100;
    strengths.push("Experiencia sobresaliente");
  } else if (workerExp >= requiredExp) {
    scores.experienceScore = 80;
    strengths.push("Experiencia suficiente");
  } else if (workerExp >= requiredExp * 0.7) {
    scores.experienceScore = 60;
  } else {
    scores.experienceScore = 30;
    weaknesses.push("Experiencia insuficiente");
  }

  if (
    job.salaryMin &&
    job.salaryMax &&
    worker.expectedSalaryMin &&
    worker.expectedSalaryMax
  ) {
    const jobAvg = (job.salaryMin + job.salaryMax) / 2;
    const workerAvg = (worker.expectedSalaryMin + worker.expectedSalaryMax) / 2;
    const diff = Math.abs(jobAvg - workerAvg) / jobAvg;

    if (diff <= 0.1) {
      scores.salaryScore = 100;
      strengths.push("Expectativa salarial perfecta");
    } else if (diff <= 0.2) {
      scores.salaryScore = 80;
    } else if (diff <= 0.3) {
      scores.salaryScore = 60;
    } else {
      scores.salaryScore = 40;
      weaknesses.push("Expectativa salarial distante");
    }
  } else {
    scores.salaryScore = 50;
  }

  if (job.startDate && worker.availableFromDate) {
    const jobDate = new Date(job.startDate);
    const workerDate = new Date(worker.availableFromDate);

    if (workerDate <= jobDate) {
      scores.availabilityScore = 100;
      strengths.push("Disponibilidad inmediata");
    } else {
      const daysDiff = Math.floor(
        (workerDate - jobDate) / (1000 * 60 * 60 * 24)
      );
      if (daysDiff <= 7) {
        scores.availabilityScore = 80;
      } else if (daysDiff <= 30) {
        scores.availabilityScore = 60;
      } else {
        scores.availabilityScore = 40;
        weaknesses.push("Disponibilidad tardía");
      }
    }
  } else {
    scores.availabilityScore = 50;
  }

  const overallScore =
    scores.skillsScore * 0.4 +
    scores.locationScore * 0.2 +
    scores.experienceScore * 0.2 +
    scores.salaryScore * 0.1 +
    scores.availabilityScore * 0.1;

  const meetsMinimumRequirements =
    scores.skillsScore >= 60 && scores.experienceScore >= 50;
  const salaryCompatible = scores.salaryScore >= 60;
  const locationCompatible = scores.locationScore >= 60;
  const availabilityCompatible = scores.availabilityScore >= 60;

  return {
    overallScore: Math.round(overallScore * 10) / 10,
    skillsScore: Math.round(scores.skillsScore * 10) / 10,
    locationScore: Math.round(scores.locationScore * 10) / 10,
    availabilityScore: Math.round(scores.availabilityScore * 10) / 10,
    salaryScore: Math.round(scores.salaryScore * 10) / 10,
    experienceScore: Math.round(scores.experienceScore * 10) / 10,
    matchedSkills,
    missingSkills,
    strengths,
    weaknesses,
    meetsMinimumRequirements,
    salaryCompatible,
    locationCompatible,
    availabilityCompatible,
  };
}

async function calculateMatchesForJob(jobId) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      JobSkillRequirement: {
        include: { Skill: true },
      },
    },
  });

  if (!job) {
    console.error(`Job ${jobId} not found`);
    return;
  }

  const workers = await prisma.workerProfile.findMany({
    include: {
      WorkerSkill: {
        include: { Skill: true },
      },
    },
  });

  console.log(
    `Calculating matches for job ${job.title} with ${workers.length} workers`
  );

  for (const worker of workers) {
    const matchScore = calculateMatchScore(job, worker);

    await prisma.jobMatch.upsert({
      where: {
        jobId_workerId: {
          jobId: job.id,
          workerId: worker.id,
        },
      },
      update: {
        overallScore: matchScore.overallScore,
        skillsScore: matchScore.skillsScore,
        locationScore: matchScore.locationScore,
        availabilityScore: matchScore.availabilityScore,
        salaryScore: matchScore.salaryScore,
        experienceScore: matchScore.experienceScore,
        matchedSkills: matchScore.matchedSkills,
        missingSkills: matchScore.missingSkills,
        strengths: matchScore.strengths,
        weaknesses: matchScore.weaknesses,
        meetsMinimumRequirements: matchScore.meetsMinimumRequirements,
        salaryCompatible: matchScore.salaryCompatible,
        locationCompatible: matchScore.locationCompatible,
        availabilityCompatible: matchScore.availabilityCompatible,
        isStale: false,
        lastUpdated: new Date(),
      },
      create: {
        id: `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        jobId: job.id,
        workerId: worker.id,
        overallScore: matchScore.overallScore,
        skillsScore: matchScore.skillsScore,
        locationScore: matchScore.locationScore,
        availabilityScore: matchScore.availabilityScore,
        salaryScore: matchScore.salaryScore,
        experienceScore: matchScore.experienceScore,
        matchedSkills: matchScore.matchedSkills,
        missingSkills: matchScore.missingSkills,
        strengths: matchScore.strengths,
        weaknesses: matchScore.weaknesses,
        meetsMinimumRequirements: matchScore.meetsMinimumRequirements,
        salaryCompatible: matchScore.salaryCompatible,
        locationCompatible: matchScore.locationCompatible,
        availabilityCompatible: matchScore.availabilityCompatible,
        calculatedAt: new Date(),
        lastUpdated: new Date(),
      },
    });
  }

  console.log(`Matches calculated for job ${job.title}`);
}

async function calculateMatchesForWorker(workerId) {
  const worker = await prisma.workerProfile.findUnique({
    where: { id: workerId },
    include: {
      WorkerSkill: {
        include: { Skill: true },
      },
    },
  });

  if (!worker) {
    console.error(`Worker ${workerId} not found`);
    return;
  }

  const jobs = await prisma.job.findMany({
    where: { status: "ACTIVE" },
    include: {
      JobSkillRequirement: {
        include: { Skill: true },
      },
    },
  });

  console.log(
    `Calculating matches for worker ${worker.fullname} with ${jobs.length} jobs`
  );

  for (const job of jobs) {
    const matchScore = calculateMatchScore(job, worker);

    await prisma.jobMatch.upsert({
      where: {
        jobId_workerId: {
          jobId: job.id,
          workerId: worker.id,
        },
      },
      update: {
        overallScore: matchScore.overallScore,
        skillsScore: matchScore.skillsScore,
        locationScore: matchScore.locationScore,
        availabilityScore: matchScore.availabilityScore,
        salaryScore: matchScore.salaryScore,
        experienceScore: matchScore.experienceScore,
        matchedSkills: matchScore.matchedSkills,
        missingSkills: matchScore.missingSkills,
        strengths: matchScore.strengths,
        weaknesses: matchScore.weaknesses,
        meetsMinimumRequirements: matchScore.meetsMinimumRequirements,
        salaryCompatible: matchScore.salaryCompatible,
        locationCompatible: matchScore.locationCompatible,
        availabilityCompatible: matchScore.availabilityCompatible,
        isStale: false,
        lastUpdated: new Date(),
      },
      create: {
        id: `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        jobId: job.id,
        workerId: worker.id,
        overallScore: matchScore.overallScore,
        skillsScore: matchScore.skillsScore,
        locationScore: matchScore.locationScore,
        availabilityScore: matchScore.availabilityScore,
        salaryScore: matchScore.salaryScore,
        experienceScore: matchScore.experienceScore,
        matchedSkills: matchScore.matchedSkills,
        missingSkills: matchScore.missingSkills,
        strengths: matchScore.strengths,
        weaknesses: matchScore.weaknesses,
        meetsMinimumRequirements: matchScore.meetsMinimumRequirements,
        salaryCompatible: matchScore.salaryCompatible,
        locationCompatible: matchScore.locationCompatible,
        availabilityCompatible: matchScore.availabilityCompatible,
        calculatedAt: new Date(),
        lastUpdated: new Date(),
      },
    });
  }

  console.log(`Matches calculated for worker ${worker.fullname}`);
}

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
        twoFactorEnabled: true,
        workerProfile: { select: { onboardingCompleted: true } },
        companyProfile: { select: { onboardingCompleted: true } },
      },
    });

    let onboardingCompleted = false;
    if (user.role === "WORKER")
      onboardingCompleted = user.workerProfile?.onboardingCompleted || false;
    if (user.role === "COMPANY")
      onboardingCompleted = user.companyProfile?.onboardingCompleted || false;

    if (user.twoFactorEnabled) {
      return res.json({
        message: "Se requiere verificación 2FA",
        requires2FA: true,
        email: user.email,
        tempToken: null,
      });
    }

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado en DB" });
    }

    return res.json({
      message: "Login exitoso",
      token: authData.session.access_token,
      role: user.role,
      userId: user.id,
      onboardingCompleted,
      requires2FA: false,
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

myRouter.post("/2fa/setup", authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.appUser.id },
      select: { twoFactorEnabled: true, email: true },
    });

    if (user.twoFactorEnabled) {
      return res.status(400).json({
        error: "La autenticación de dos factores ya está habilitada",
      });
    }

    const secret = speakeasy.generateSecret({
      name: `WorkStaff (${user.email})`,
      issuer: "WorkStaff",
      length: 20,
    });

    await prisma.user.update({
      where: { id: req.appUser.id },
      data: { twoFactorSecret: secret.base32 },
    });

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    return res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntryKey: secret.base32,
    });
  } catch (err) {
    console.error("Error configurando 2FA:", err);
    return res.status(500).json({ error: "Error en el servidor" });
  }
});

myRouter.post("/2fa/verify", authMiddleware, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Código requerido" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.appUser.id },
      select: { twoFactorSecret: true, twoFactorEnabled: true },
    });

    if (!user.twoFactorSecret) {
      return res.status(400).json({
        error: "Primero debes configurar la autenticación de dos factores",
      });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: token,
      window: 2,
    });

    if (!verified) {
      return res.status(400).json({ error: "Código incorrecto" });
    }

    const backupCodes = [];
    for (let i = 0; i < 8; i++) {
      backupCodes.push(Math.random().toString(36).substr(2, 8).toUpperCase());
    }

    await prisma.user.update({
      where: { id: req.appUser.id },
      data: {
        twoFactorEnabled: true,
        twoFactorBackupCodes: backupCodes,
      },
    });

    return res.json({
      message: "Autenticación de dos factores habilitada correctamente",
      backupCodes,
    });
  } catch (err) {
    console.error("Error verificando 2FA:", err);
    return res.status(500).json({ error: "Error en el servidor" });
  }
});

myRouter.delete("/2fa/disable", authMiddleware, async (req, res) => {
  try {
    const { password, token } = req.body;

    if (!password) {
      return res.status(400).json({ error: "Contraseña requerida" });
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: req.appUser.email,
      password: password,
    });

    if (signInError) {
      return res.status(400).json({ error: "Contraseña incorrecta" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.appUser.id },
      select: {
        twoFactorEnabled: true,
        twoFactorSecret: true,
        twoFactorBackupCodes: true,
      },
    });

    if (!user.twoFactorEnabled) {
      return res.status(400).json({
        error: "La autenticación de dos factores no está habilitada",
      });
    }

    if (token) {
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: "base32",
        token: token,
        window: 2,
      });

      if (!verified) {
        const backupCodeIndex = user.twoFactorBackupCodes.indexOf(
          token.toUpperCase()
        );
        if (backupCodeIndex === -1) {
          return res.status(400).json({ error: "Código incorrecto" });
        }
      }
    }

    await prisma.user.update({
      where: { id: req.appUser.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      },
    });

    return res.json({
      message: "Autenticación de dos factores deshabilitada correctamente",
    });
  } catch (err) {
    console.error("Error deshabilitando 2FA:", err);
    return res.status(500).json({ error: "Error en el servidor" });
  }
});

myRouter.post("/2fa/login-verify", async (req, res) => {
  try {
    const { email, token, password } = req.body;

    if (!email || !token || !password) {
      return res
        .status(400)
        .json({ error: "Email, contraseña y código requeridos" });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        workerProfile: {
          select: { onboardingCompleted: true, fullname: true, photoUrl: true },
        },
        companyProfile: {
          select: {
            onboardingCompleted: true,
            name: true,
            cif: true,
            logoUrl: true,
          },
        },
      },
    });

    if (!user || !user.twoFactorEnabled) {
      return res.status(400).json({ error: "Usuario no válido" });
    }

    let isValidToken = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token,
      window: 2,
    });

    if (!isValidToken) {
      const backupCodeIndex = user.twoFactorBackupCodes.indexOf(
        token.toUpperCase()
      );
      if (backupCodeIndex !== -1) {
        isValidToken = true;
        const updatedBackupCodes = user.twoFactorBackupCodes.filter(
          (_, idx) => idx !== backupCodeIndex
        );
        await prisma.user.update({
          where: { id: user.id },
          data: { twoFactorBackupCodes: updatedBackupCodes },
        });
      }
    }

    if (!isValidToken) {
      return res.status(400).json({ error: "Código incorrecto" });
    }

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError || !authData.session) {
      return res
        .status(401)
        .json({ error: "Error iniciando sesión en Supabase" });
    }

    let onboardingCompleted = false;
    if (user.role === "WORKER")
      onboardingCompleted = user.workerProfile?.onboardingCompleted || false;
    if (user.role === "COMPANY")
      onboardingCompleted = user.companyProfile?.onboardingCompleted || false;

    return res.json({
      message: "Verificación 2FA exitosa",
      token: authData.session.access_token,
      role: user.role,
      userId: user.id,
      onboardingCompleted,
      user,
    });
  } catch (err) {
    console.error("Error verificando 2FA en login:", err);
    return res.status(500).json({ error: "Error en el servidor" });
  }
});

myRouter.post("/2fa/backup-codes", authMiddleware, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: "Contraseña requerida" });
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: req.appUser.email,
      password: password,
    });

    if (signInError) {
      return res.status(400).json({ error: "Contraseña incorrecta" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.appUser.id },
      select: { twoFactorEnabled: true },
    });

    if (!user.twoFactorEnabled) {
      return res.status(400).json({
        error: "La autenticación de dos factores no está habilitada",
      });
    }

    const backupCodes = [];
    for (let i = 0; i < 8; i++) {
      backupCodes.push(Math.random().toString(36).substr(2, 8).toUpperCase());
    }

    await prisma.user.update({
      where: { id: req.appUser.id },
      data: { twoFactorBackupCodes: backupCodes },
    });

    return res.json({
      message: "Códigos de respaldo regenerados",
      backupCodes,
    });
  } catch (err) {
    console.error("Error generando códigos de respaldo:", err);
    return res.status(500).json({ error: "Error en el servidor" });
  }
});

myRouter.get("/2fa/status", authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.appUser.id },
      select: {
        twoFactorEnabled: true,
        twoFactorBackupCodes: true,
      },
    });

    return res.json({
      enabled: user.twoFactorEnabled,
      backupCodesCount: user.twoFactorBackupCodes.length,
    });
  } catch (err) {
    console.error("Error obteniendo estado 2FA:", err);
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
        experienceDescription,
        workerAvailability,
        certificate,
        workHistory,
        location,
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
      if (experienceDescription !== undefined)
        data.experienceDescription = experienceDescription;
      if (workerAvailability !== undefined)
        data.workerAvailability = parseToArray(workerAvailability);
      if (certificate !== undefined)
        data.certificate = parseToArray(certificate);
      if (workHistory !== undefined) data.workHistory = workHistory;
      if (location !== undefined) data.location = location;

      const updated = await prisma.workerProfile.update({
        where: { userId: req.appUser.id },
        data: {
          ...data,
          onboardingCompleted: true,
        },
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
          onboardingCompleted: true,
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

myRouter.post(
  "/company/jobs",
  authMiddleware,
  roleMiddleware(["COMPANY"]),
  upload.single("image"),
  async (req, res) => {
    try {
      const { title, description, location, requiredSkillsData, duration } =
        req.body;

      if (!title || !description || !location) {
        return res
          .status(400)
          .json({ error: "Título, descripción y ubicación son obligatorios" });
      }

      let requiredSkillsArray = [];
      if (requiredSkillsData) {
        try {
          requiredSkillsArray = JSON.parse(requiredSkillsData);
        } catch (e) {
          return res.status(400).json({ error: "Formato de skills inválido" });
        }
      }

      if (requiredSkillsArray.length === 0) {
        return res
          .status(400)
          .json({ error: "Debes añadir al menos una habilidad" });
      }

      const skillNames = requiredSkillsArray.map((s) => s.name);
      const existingSkills = await prisma.skill.findMany({
        where: { name: { in: skillNames } },
      });

      if (existingSkills.length !== skillNames.length) {
        const missing = skillNames.filter(
          (name) => !existingSkills.find((s) => s.name === name)
        );
        return res.status(400).json({
          error: `Skills no encontradas en la base de datos: ${missing.join(
            ", "
          )}`,
        });
      }

      let imageUrl = null;
      if (req.file) {
        const timestamp = Date.now();
        const imageId = `job-image-${timestamp}-${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        const fileExt = req.file.originalname.split(".").pop();
        const filePath = `${req.appUser.id}/jobs/${imageId}.${fileExt}`;

        const { error: uploadError } = await supabaseAdmin.storage
          .from("user-documents")
          .upload(filePath, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: true,
          });

        if (uploadError) throw new Error(uploadError.message);

        const { data: signedUrlData, error: urlError } =
          await supabaseAdmin.storage
            .from("user-documents")
            .createSignedUrl(filePath, 60 * 60 * 24 * 365 * 10);

        if (urlError) throw new Error(urlError.message);
        imageUrl = signedUrlData.signedUrl;
      }

      const companyProfile = await prisma.companyProfile.findUnique({
        where: { userId: req.appUser.id },
        select: { id: true },
      });

      if (!companyProfile) {
        return res
          .status(404)
          .json({ error: "Perfil de empresa no encontrado" });
      }

      const job = await prisma.$transaction(async (tx) => {
        const newJob = await tx.job.create({
          data: {
            title,
            description,
            location,
            duration: duration || null,
            salaryMin: 10,
            salaryMax: 10,
            salaryCurrency: "EUR",
            salaryPeriod: "HORA",
            companyId: companyProfile.id,
            imageUrl,
          },
        });

        const skillRelations = requiredSkillsArray.map((skillData) => {
          const skill = existingSkills.find((s) => s.name === skillData.name);
          const requirementId = `req_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;

          return {
            id: requirementId,
            jobId: newJob.id,
            skillId: skill.id,
            minimumLevel: skillData.level,
            isRequired: skillData.isRequired,
            weight: skillData.weight,
          };
        });

        await tx.jobSkillRequirement.createMany({
          data: skillRelations,
        });

        return await tx.job.findUnique({
          where: { id: newJob.id },
          include: {
            JobSkillRequirement: {
              include: { Skill: true },
            },
          },
        });
      });

      try {
        await calculateMatchesForJob(job.id);
      } catch (matchError) {
        console.error("Error calculando matches:", matchError);
      }

      return res.status(201).json({
        message: "Oferta creada correctamente",
        job,
      });
    } catch (err) {
      console.error("Error creando oferta:", err);
      return res
        .status(500)
        .json({ error: err.message || "Error creando la oferta" });
    }
  }
);

myRouter.put(
  "/company/jobs/:jobId",
  authMiddleware,
  roleMiddleware(["COMPANY"]),
  upload.single("image"),
  async (req, res) => {
    try {
      const { jobId } = req.params;
      const {
        title,
        description,
        location,
        requiredSkillsData,
        duration,
      } = req.body;

      const companyProfile = await prisma.companyProfile.findUnique({
        where: { userId: req.appUser.id },
        select: { id: true },
      });

      if (!companyProfile) {
        return res
          .status(404)
          .json({ error: "Perfil de empresa no encontrado" });
      }

      const job = await prisma.job.findFirst({
        where: {
          id: jobId,
          companyId: companyProfile.id,
        },
      });

      if (!job) {
        return res.status(404).json({ error: "Oferta no encontrada" });
      }

      if (!title || !description || !location) {
        return res.status(400).json({
          error: "Título, descripción y ubicación son obligatorios",
        });
      }

      let requiredSkillsArray = [];
      if (requiredSkillsData) {
        try {
          requiredSkillsArray = JSON.parse(requiredSkillsData);
        } catch (e) {
          return res.status(400).json({ error: "Formato de skills inválido" });
        }
      }

      if (requiredSkillsArray.length === 0) {
        return res.status(400).json({
          error: "Debes añadir al menos una habilidad",
        });
      }

      const skillNames = requiredSkillsArray.map((s) => s.name);
      const existingSkills = await prisma.skill.findMany({
        where: { name: { in: skillNames } },
      });

      if (existingSkills.length !== skillNames.length) {
        const missing = skillNames.filter(
          (name) => !existingSkills.find((s) => s.name === name)
        );
        return res.status(400).json({
          error: `Skills no encontradas: ${missing.join(", ")}`,
        });
      }

      let imageUrl = job.imageUrl;
      if (req.file) {
        const timestamp = Date.now();
        const imageId = `job-image-${timestamp}-${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        const fileExt = req.file.originalname.split(".").pop();
        const filePath = `${req.appUser.id}/jobs/${imageId}.${fileExt}`;

        const { error: uploadError } = await supabaseAdmin.storage
          .from("user-documents")
          .upload(filePath, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: true,
          });

        if (uploadError) throw new Error(uploadError.message);

        const { data: signedUrlData, error: urlError } =
          await supabaseAdmin.storage
            .from("user-documents")
            .createSignedUrl(filePath, 60 * 60 * 24 * 365 * 10);

        if (urlError) throw new Error(urlError.message);
        imageUrl = signedUrlData.signedUrl;
      }

      const updatedJob = await prisma.$transaction(async (tx) => {
        const updated = await tx.job.update({
          where: { id: jobId },
          data: {
            title,
            description,
            location,
            duration: duration || null,
            salaryMin: 10,
            salaryMax: 10,
            salaryCurrency: "EUR",
            salaryPeriod: "HORA",
            imageUrl,
          },
        });

        await tx.jobSkillRequirement.deleteMany({
          where: { jobId: updated.id },
        });

        const skillRelations = requiredSkillsArray.map((skillData) => {
          const skill = existingSkills.find((s) => s.name === skillData.name);
          const requirementId = `req_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;

          return {
            id: requirementId,
            jobId: updated.id,
            skillId: skill.id,
            minimumLevel: skillData.level || "BASICO",
            isRequired: skillData.isRequired !== false,
            weight: skillData.weight || 1,
          };
        });

        await tx.jobSkillRequirement.createMany({
          data: skillRelations,
        });

        return await tx.job.findUnique({
          where: { id: updated.id },
          include: {
            JobSkillRequirement: {
              include: { Skill: true },
            },
          },
        });
      });

      try {
        await calculateMatchesForJob(updatedJob.id);
      } catch (matchError) {
        console.error("Error recalculando matches:", matchError);
      }

      return res.json({
        message: "Oferta actualizada correctamente",
        job: updatedJob,
      });
    } catch (err) {
      console.error("Error actualizando oferta:", err);
      return res.status(500).json({
        error: err.message || "Error actualizando la oferta",
      });
    }
  }
);

myRouter.get("/skills", authMiddleware, async (req, res) => {
  try {
    const skills = await prisma.skill.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
    return res.json({ skills });
  } catch (err) {
    console.error("Error obteniendo skills:", err);
    return res.status(500).json({ error: "Error en el servidor" });
  }
});

myRouter.post("/skills", authMiddleware, async (req, res) => {
  try {
    const { name, category } = req.body;

    if (!name || !category) {
      return res
        .status(400)
        .json({ error: "Nombre y categoría son obligatorios" });
    }

    const existing = await prisma.skill.findUnique({ where: { name } });
    if (existing) {
      return res.status(400).json({ error: "Esta skill ya existe" });
    }

    const skill = await prisma.skill.create({
      data: { name, category },
    });

    return res.status(201).json({ skill });
  } catch (err) {
    console.error("Error creando skill:", err);
    return res.status(500).json({ error: "Error en el servidor" });
  }
});

myRouter.put(
  "/worker/skills",
  authMiddleware,
  roleMiddleware(["WORKER"]),
  async (req, res) => {
    try {
      const { skills } = req.body;

      if (!Array.isArray(skills)) {
        return res.status(400).json({ error: "Skills debe ser un array" });
      }

      const workerProfile = await prisma.workerProfile.findUnique({
        where: { userId: req.appUser.id },
        select: { id: true },
      });

      if (!workerProfile) {
        return res
          .status(404)
          .json({ error: "Perfil de trabajador no encontrado" });
      }

      await prisma.workerSkill.deleteMany({
        where: { workerId: workerProfile.id },
      });

      if (skills.length > 0) {
        const skillsToCreate = skills.map((s) => ({
          id: `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          workerId: workerProfile.id,
          skillId: s.skillId,
          level: s.level || "BASICO",
          yearsExperience: s.yearsExperience || 0,
          verified: false,
        }));

        await prisma.workerSkill.createMany({
          data: skillsToCreate,
        });
      }

      try {
        await calculateMatchesForWorker(workerProfile.id);
      } catch (matchError) {
        console.error("Error recalculando matches:", matchError);
      }

      return res.json({ message: "Skills actualizadas correctamente" });
    } catch (err) {
      console.error("Error actualizando skills:", err);
      return res.status(500).json({ error: "Error en el servidor" });
    }
  }
);

myRouter.get(
  "/worker/skills",
  authMiddleware,
  roleMiddleware(["WORKER"]),
  async (req, res) => {
    try {
      const workerProfile = await prisma.workerProfile.findUnique({
        where: { userId: req.appUser.id },
        include: {
          WorkerSkill: {
            include: {
              Skill: true,
            },
          },
        },
      });

      if (!workerProfile) {
        return res.status(404).json({ error: "Perfil no encontrado" });
      }

      return res.json({ skills: workerProfile.WorkerSkill });
    } catch (err) {
      console.error("Error obteniendo skills:", err);
      return res.status(500).json({ error: "Error en el servidor" });
    }
  }
);

myRouter.post(
  "/company/jobs/:jobId/calculate-matches",
  authMiddleware,
  roleMiddleware(["COMPANY"]),
  async (req, res) => {
    try {
      const { jobId } = req.params;

      const companyProfile = await prisma.companyProfile.findUnique({
        where: { userId: req.appUser.id },
        select: { id: true },
      });

      if (!companyProfile) {
        return res
          .status(404)
          .json({ error: "Perfil de empresa no encontrado" });
      }

      const job = await prisma.job.findFirst({
        where: { id: jobId, companyId: companyProfile.id },
        include: {
          JobSkillRequirement: {
            include: { Skill: true },
          },
        },
      });

      if (!job) {
        return res.status(404).json({ error: "Oferta no encontrada" });
      }

      const workers = await prisma.workerProfile.findMany({
        include: {
          WorkerSkill: {
            include: { Skill: true },
          },
        },
      });

      const matches = [];

      for (const worker of workers) {
        const matchScore = calculateMatchScore(job, worker);

        const match = await prisma.jobMatch.upsert({
          where: {
            jobId_workerId: {
              jobId: job.id,
              workerId: worker.id,
            },
          },
          update: {
            overallScore: matchScore.overallScore,
            skillsScore: matchScore.skillsScore,
            locationScore: matchScore.locationScore,
            availabilityScore: matchScore.availabilityScore,
            salaryScore: matchScore.salaryScore,
            experienceScore: matchScore.experienceScore,
            matchedSkills: matchScore.matchedSkills,
            missingSkills: matchScore.missingSkills,
            strengths: matchScore.strengths,
            weaknesses: matchScore.weaknesses,
            meetsMinimumRequirements: matchScore.meetsMinimumRequirements,
            salaryCompatible: matchScore.salaryCompatible,
            locationCompatible: matchScore.locationCompatible,
            availabilityCompatible: matchScore.availabilityCompatible,
            isStale: false,
            lastUpdated: new Date(),
          },
          create: {
            id: `match_${Date.now()}_${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            jobId: job.id,
            workerId: worker.id,
            overallScore: matchScore.overallScore,
            skillsScore: matchScore.skillsScore,
            locationScore: matchScore.locationScore,
            availabilityScore: matchScore.availabilityScore,
            salaryScore: matchScore.salaryScore,
            experienceScore: matchScore.experienceScore,
            matchedSkills: matchScore.matchedSkills,
            missingSkills: matchScore.missingSkills,
            strengths: matchScore.strengths,
            weaknesses: matchScore.weaknesses,
            meetsMinimumRequirements: matchScore.meetsMinimumRequirements,
            salaryCompatible: matchScore.salaryCompatible,
            locationCompatible: matchScore.locationCompatible,
            availabilityCompatible: matchScore.availabilityCompatible,
            calculatedAt: new Date(),
            lastUpdated: new Date(),
          },
        });

        matches.push(match);
      }

      return res.json({
        message: "Matches calculados correctamente",
        totalMatches: matches.length,
      });
    } catch (err) {
      console.error("Error calculando matches:", err);
      return res.status(500).json({ error: "Error en el servidor" });
    }
  }
);

myRouter.get(
  "/company/jobs/:jobId/matches",
  authMiddleware,
  roleMiddleware(["COMPANY"]),
  async (req, res) => {
    try {
      const { jobId } = req.params;
      const { limit = 10, minScore = 0 } = req.query;

      const companyProfile = await prisma.companyProfile.findUnique({
        where: { userId: req.appUser.id },
        select: { id: true },
      });

      if (!companyProfile) {
        return res
          .status(404)
          .json({ error: "Perfil de empresa no encontrado" });
      }

      const job = await prisma.job.findFirst({
        where: { id: jobId, companyId: companyProfile.id },
      });

      if (!job) {
        return res.status(404).json({ error: "Oferta no encontrada" });
      }

      const matches = await prisma.jobMatch.findMany({
        where: {
          jobId,
          overallScore: { gte: parseFloat(minScore) },
        },
        include: {
          WorkerProfile: {
            include: {
              WorkerSkill: {
                include: { Skill: true },
              },
              user: {
                select: { email: true },
              },
            },
          },
        },
        orderBy: { overallScore: "desc" },
        take: parseInt(limit),
      });

      const matchesWithSignedUrls = await Promise.all(
        matches.map(async (match) => {
          let photoUrl = null;

          if (match.WorkerProfile.photoUrl) {
            const isFullUrl = match.WorkerProfile.photoUrl.startsWith("http");
            if (isFullUrl) {
              photoUrl = match.WorkerProfile.photoUrl;
            } else {
              try {
                const { data, error } = await supabaseAdmin.storage
                  .from("user-documents")
                  .createSignedUrl(
                    match.WorkerProfile.photoUrl,
                    60 * 60 * 24 * 365 * 10
                  );

                if (!error) {
                  photoUrl = data.signedUrl;
                }
              } catch (error) {
                console.error("Error generando URL firmada:", error);
              }
            }
          }

          return {
            ...match,
            WorkerProfile: {
              ...match.WorkerProfile,
              photoUrl,
            },
          };
        })
      );

      return res.json({ matches: matchesWithSignedUrls });
    } catch (err) {
      console.error("Error obteniendo matches:", err);
      return res.status(500).json({ error: "Error en el servidor" });
    }
  }
);

myRouter.get(
  "/worker/recommended-jobs",
  authMiddleware,
  roleMiddleware(["WORKER"]),
  async (req, res) => {
    try {
      const { limit = 10, minScore = 50 } = req.query;

      const workerProfile = await prisma.workerProfile.findUnique({
        where: { userId: req.appUser.id },
        select: { id: true },
      });

      if (!workerProfile) {
        return res.status(404).json({ error: "Perfil no encontrado" });
      }

      const matches = await prisma.jobMatch.findMany({
        where: {
          workerId: workerProfile.id,
          overallScore: { gte: parseFloat(minScore) },
          Job: { status: "ACTIVE" },
        },
        include: {
          Job: {
            include: {
              company: {
                select: {
                  name: true,
                  logoUrl: true,
                },
              },
              JobSkillRequirement: {
                include: {
                  Skill: true,
                },
              },
            },
          },
        },
        orderBy: { overallScore: "desc" },
        take: parseInt(limit),
      });

      const matchesWithSignedUrls = await Promise.all(
        matches.map(async (match) => {
          let logoUrl = null;

          if (match.Job.company.logoUrl) {
            const isFullUrl = match.Job.company.logoUrl.startsWith("http");
            if (isFullUrl) {
              logoUrl = match.Job.company.logoUrl;
            } else {
              try {
                const { data, error } = await supabaseAdmin.storage
                  .from("user-documents")
                  .createSignedUrl(
                    match.Job.company.logoUrl,
                    60 * 60 * 24 * 365 * 10
                  );

                if (!error) {
                  logoUrl = data.signedUrl;
                }
              } catch (error) {
                console.error("Error generando URL firmada:", error);
              }
            }
          }

          return {
            ...match,
            Job: {
              ...match.Job,
              company: {
                ...match.Job.company,
                logoUrl,
              },
            },
          };
        })
      );

      return res.json({ matches: matchesWithSignedUrls });
    } catch (err) {
      console.error("Error obteniendo trabajos recomendados:", err);
      return res.status(500).json({ error: "Error en el servidor" });
    }
  }
);

myRouter.get(
  "/company/jobs",
  authMiddleware,
  roleMiddleware(["COMPANY"]),
  async (req, res) => {
    try {
      const { page = 1, limit = 6, search = "" } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const companyProfile = await prisma.companyProfile.findUnique({
        where: { userId: req.appUser.id },
        select: { id: true },
      });

      if (!companyProfile) {
        return res
          .status(404)
          .json({ error: "Perfil de empresa no encontrado" });
      }

      const whereClause = {
        companyId: companyProfile.id,
        ...(search && {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { location: { contains: search, mode: "insensitive" } },
          ],
        }),
      };

      const [jobs, totalCount] = await Promise.all([
        prisma.job.findMany({
          where: whereClause,
          select: {
            id: true,
            title: true,
            description: true,
            location: true,
            duration: true,
            salaryMin: true,
            salaryMax: true,
            imageUrl: true,
            createdAt: true,
            JobSkillRequirement: {
              include: {
                Skill: true,
              },
            },
            _count: {
              select: {
                applications: true,
                contracts: true,
              },
            },
            applications: {
              select: {
                id: true,
                status: true,
                createdAt: true,
                worker: {
                  select: {
                    id: true,
                    fullname: true,
                    photoUrl: true,
                  },
                },
              },
              take: 5,
              orderBy: { createdAt: "desc" },
            },
          },
          orderBy: { createdAt: "desc" },
          skip: parseInt(skip),
          take: parseInt(limit),
        }),
        prisma.job.count({ where: whereClause }),
      ]);

      const jobsWithProcessedData = await Promise.all(
        jobs.map(async (job) => {
          const processedApplications = await Promise.all(
            job.applications.map(async (application) => {
              let workerPhotoUrl = null;

              if (application.worker.photoUrl) {
                const isFullUrl =
                  application.worker.photoUrl.startsWith("http");
                if (isFullUrl) {
                  workerPhotoUrl = application.worker.photoUrl;
                } else {
                  try {
                    const { data, error } = await supabaseAdmin.storage
                      .from("user-documents")
                      .createSignedUrl(
                        application.worker.photoUrl,
                        60 * 60 * 24 * 365 * 10
                      );

                    if (!error) {
                      workerPhotoUrl = data.signedUrl;
                    }
                  } catch (error) {
                    console.error("Error generando URL firmada:", error);
                  }
                }
              }

              return {
                ...application,
                worker: {
                  ...application.worker,
                  photoUrl: workerPhotoUrl,
                },
              };
            })
          );

          return {
            id: job.id,
            title: job.title,
            description: job.description,
            location: job.location,
            requiredSkills: job.JobSkillRequirement.map(
              (req) => req.Skill.name
            ),
            duration: job.duration,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
            imageUrl: job.imageUrl,
            createdAt: job.createdAt,
            applicationsCount: job._count.applications,
            contractsCount: job._count.contracts,
            applications: processedApplications,
          };
        })
      );

      const totalPages = Math.ceil(totalCount / parseInt(limit));

      return res.json({
        jobs: jobsWithProcessedData,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNextPage: parseInt(page) < totalPages,
          hasPreviousPage: parseInt(page) > 1,
        },
      });
    } catch (err) {
      console.error("Error obteniendo ofertas:", err);
      return res.status(500).json({ error: "Error en el servidor" });
    }
  }
);

myRouter.get(
  "/company/jobs/:jobId",
  authMiddleware,
  roleMiddleware(["COMPANY"]),
  async (req, res) => {
    try {
      const { jobId } = req.params;

      const companyProfile = await prisma.companyProfile.findUnique({
        where: { userId: req.appUser.id },
        select: { id: true },
      });

      if (!companyProfile) {
        return res
          .status(404)
          .json({ error: "Perfil de empresa no encontrado" });
      }

      const job = await prisma.job.findFirst({
        where: {
          id: jobId,
          companyId: companyProfile.id,
        },
        select: {
          id: true,
          title: true,
          description: true,
          location: true,
          duration: true,
          salaryMin: true,
          salaryMax: true,
          imageUrl: true,
          createdAt: true,
          company: {
            select: {
              name: true,
              logoUrl: true,
            },
          },
          JobSkillRequirement: {
            include: {
              Skill: true,
            },
          },
          _count: {
            select: {
              applications: true,
              contracts: true,
            },
          },
          applications: {
            select: {
              id: true,
              status: true,
              createdAt: true,
              worker: {
                select: {
                  id: true,
                  fullname: true,
                  photoUrl: true,
                  location: true,
                  totalYearsExperience: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!job) {
        return res.status(404).json({ error: "Oferta no encontrada" });
      }

      const processedApplications = await Promise.all(
        job.applications.map(async (application) => {
          let workerPhotoUrl = null;

          if (application.worker.photoUrl) {
            const isFullUrl = application.worker.photoUrl.startsWith("http");
            if (isFullUrl) {
              workerPhotoUrl = application.worker.photoUrl;
            } else {
              try {
                const { data, error } = await supabaseAdmin.storage
                  .from("user-documents")
                  .createSignedUrl(
                    application.worker.photoUrl,
                    60 * 60 * 24 * 365 * 10
                  );

                if (!error) {
                  workerPhotoUrl = data.signedUrl;
                }
              } catch (error) {
                console.error("Error generando URL firmada:", error);
              }
            }
          }

          return {
            ...application,
            worker: {
              ...application.worker,
              photoUrl: workerPhotoUrl,
            },
          };
        })
      );

      let companyLogoUrl = null;
      if (job.company.logoUrl) {
        const isFullUrl = job.company.logoUrl.startsWith("http");
        if (isFullUrl) {
          companyLogoUrl = job.company.logoUrl;
        } else {
          try {
            const { data, error } = await supabaseAdmin.storage
              .from("user-documents")
              .createSignedUrl(job.company.logoUrl, 60 * 60 * 24 * 365 * 10);

            if (!error) {
              companyLogoUrl = data.signedUrl;
            }
          } catch (error) {
            console.error("Error generando URL firmada:", error);
          }
        }
      }

      const jobWithProcessedData = {
        ...job,
        requiredSkills: job.JobSkillRequirement.map((req) => ({
          name: req.Skill.name,
          level: req.minimumLevel,
          isRequired: req.isRequired,
          weight: req.weight,
        })),
        applicationsCount: job._count.applications,
        contractsCount: job._count.contracts,
        applications: processedApplications,
        company: {
          ...job.company,
          logoUrl: companyLogoUrl,
        },
      };

      return res.json({ job: jobWithProcessedData });
    } catch (err) {
      console.error("Error obteniendo oferta:", err);
      return res.status(500).json({ error: "Error en el servidor" });
    }
  }
);

myRouter.delete(
  "/company/jobs/:jobId",
  authMiddleware,
  roleMiddleware(["COMPANY"]),
  async (req, res) => {
    try {
      const { jobId } = req.params;

      const companyProfile = await prisma.companyProfile.findUnique({
        where: { userId: req.appUser.id },
        select: { id: true },
      });

      if (!companyProfile) {
        return res
          .status(404)
          .json({ error: "Perfil de empresa no encontrado" });
      }

      const existingJob = await prisma.job.findFirst({
        where: {
          id: jobId,
          companyId: companyProfile.id,
        },
        select: {
          id: true,
          imageUrl: true,
          _count: {
            select: {
              applications: true,
              contracts: true,
            },
          },
        },
      });

      if (!existingJob) {
        return res.status(404).json({ error: "Oferta no encontrada" });
      }

      if (existingJob._count.contracts > 0) {
        return res.status(400).json({
          error: "No se puede eliminar una oferta con contratos activos",
        });
      }

      await prisma.job.delete({
        where: { id: jobId },
      });

      return res.json({ message: "Oferta eliminada correctamente" });
    } catch (err) {
      console.error("Error eliminando oferta:", err);
      return res.status(500).json({
        error: err.message || "Error eliminando la oferta",
      });
    }
  }
);

myRouter.get(
  "/worker/jobs",
  authMiddleware,
  roleMiddleware(["WORKER"]),
  async (req, res) => {
    try {
      const { page = 1, limit = 9, search = "", location = "" } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const whereClause = {
        status: "ACTIVE",
        ...(search && {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }),
        ...(location && {
          location: { contains: location, mode: "insensitive" },
        }),
      };

      const [jobs, totalCount] = await Promise.all([
        prisma.job.findMany({
          where: whereClause,
          select: {
            id: true,
            title: true,
            description: true,
            location: true,
            duration: true,
            salaryMin: true,
            salaryMax: true,
            imageUrl: true,
            createdAt: true,
            company: {
              select: {
                name: true,
                logoUrl: true,
              },
            },
            JobSkillRequirement: {
              include: {
                Skill: true,
              },
            },
            _count: {
              select: {
                applications: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip: parseInt(skip),
          take: parseInt(limit),
        }),
        prisma.job.count({ where: whereClause }),
      ]);

      const jobsWithProcessedLogos = await Promise.all(
        jobs.map(async (job) => {
          let companyLogoUrl = null;

          if (job.company.logoUrl) {
            const isFullUrl = job.company.logoUrl.startsWith("http");
            if (isFullUrl) {
              companyLogoUrl = job.company.logoUrl;
            } else {
              try {
                const { data, error } = await supabaseAdmin.storage
                  .from("user-documents")
                  .createSignedUrl(
                    job.company.logoUrl,
                    60 * 60 * 24 * 365 * 10
                  );

                if (!error) {
                  companyLogoUrl = data.signedUrl;
                }
              } catch (error) {
                console.error("Error generando URL firmada:", error);
              }
            }
          }

          return {
            ...job,
            requiredSkills: job.JobSkillRequirement.map(
              (req) => req.Skill.name
            ),
            company: {
              ...job.company,
              logoUrl: companyLogoUrl,
            },
            applicationsCount: job._count.applications,
          };
        })
      );

      const totalPages = Math.ceil(totalCount / parseInt(limit));

      return res.json({
        jobs: jobsWithProcessedLogos,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNextPage: parseInt(page) < totalPages,
          hasPreviousPage: parseInt(page) > 1,
        },
      });
    } catch (err) {
      console.error("Error obteniendo ofertas:", err);
      return res.status(500).json({ error: "Error en el servidor" });
    }
  }
);

myRouter.get(
  "/worker/jobs/:jobId",
  authMiddleware,
  roleMiddleware(["WORKER"]),
  async (req, res) => {
    try {
      const { jobId } = req.params;

      const job = await prisma.job.findUnique({
        where: { id: jobId },
        select: {
          id: true,
          title: true,
          description: true,
          location: true,
          duration: true,
          salaryMin: true,
          salaryMax: true,
          imageUrl: true,
          createdAt: true,
          company: {
            select: {
              name: true,
              logoUrl: true,
              contactInfo: true,
            },
          },
          JobSkillRequirement: {
            include: {
              Skill: true,
            },
          },
          _count: {
            select: {
              applications: true,
            },
          },
        },
      });

      if (!job) {
        return res.status(404).json({ error: "Oferta no encontrada" });
      }

      let companyLogoUrl = null;
      if (job.company.logoUrl) {
        const isFullUrl = job.company.logoUrl.startsWith("http");
        if (isFullUrl) {
          companyLogoUrl = job.company.logoUrl;
        } else {
          try {
            const { data, error } = await supabaseAdmin.storage
              .from("user-documents")
              .createSignedUrl(job.company.logoUrl, 60 * 60 * 24 * 365 * 10);

            if (!error) {
              companyLogoUrl = data.signedUrl;
            }
          } catch (error) {
            console.error("Error generando URL firmada:", error);
          }
        }
      }

      return res.json({
        job: {
          ...job,
          requiredSkills: job.JobSkillRequirement.map((req) => ({
            name: req.Skill.name,
            level: req.minimumLevel,
            isRequired: req.isRequired,
          })),
          company: {
            ...job.company,
            logoUrl: companyLogoUrl,
          },
          applicationsCount: job._count.applications,
        },
      });
    } catch (err) {
      console.error("Error obteniendo detalle de oferta:", err);
      return res.status(500).json({ error: "Error en el servidor" });
    }
  }
);

myRouter.get("/test/matching-status", async (req, res) => {
  try {
    const stats = {
      skills: await prisma.skill.count(),
      workers: await prisma.workerProfile.count(),
      jobs: await prisma.job.count(),
      matches: await prisma.jobMatch.count(),
      workerSkills: await prisma.workerSkill.count(),
      jobSkillReqs: await prisma.jobSkillRequirement.count(),
    };

    const workers = await prisma.workerProfile.findMany({
      select: {
        id: true,
        fullname: true,
        location: true,
        totalYearsExperience: true,
      },
      take: 3,
    });

    const jobs = await prisma.job.findMany({
      select: {
        id: true,
        title: true,
        location: true,
        status: true,
        minimumYearsExperience: true,
      },
      where: { status: "ACTIVE" },
      take: 3,
    });

    let workerWithSkills = null;
    if (workers.length > 0) {
      try {
        workerWithSkills = await prisma.workerProfile.findUnique({
          where: { id: workers[0].id },
          include: {
            WorkerSkill: {
              include: {
                Skill: true,
              },
            },
          },
        });
      } catch (e) {
        workerWithSkills = { error: e.message };
      }
    }

    let jobWithSkills = null;
    if (jobs.length > 0) {
      try {
        jobWithSkills = await prisma.job.findUnique({
          where: { id: jobs[0].id },
          include: {
            JobSkillRequirement: {
              include: {
                Skill: true,
              },
            },
          },
        });
      } catch (e) {
        jobWithSkills = { error: e.message };
      }
    }

    const topMatches = await prisma.jobMatch.findMany({
      select: {
        overallScore: true,
        skillsScore: true,
        locationScore: true,
        experienceScore: true,
        meetsMinimumRequirements: true,
        Job: {
          select: {
            title: true,
            location: true,
          },
        },
        WorkerProfile: {
          select: {
            fullname: true,
            location: true,
          },
        },
      },
      orderBy: { overallScore: "desc" },
      take: 5,
    });

    let sampleMatchAnalysis = null;
    if (topMatches.length > 0) {
      const firstMatch = await prisma.jobMatch.findFirst({
        include: {
          Job: {
            include: {
              JobSkillRequirement: {
                include: {
                  Skill: true,
                },
              },
            },
          },
          WorkerProfile: {
            include: {
              WorkerSkill: {
                include: {
                  Skill: true,
                },
              },
            },
          },
        },
        orderBy: { overallScore: "desc" },
      });

      if (firstMatch) {
        sampleMatchAnalysis = {
          overallScore: firstMatch.overallScore,
          breakdown: {
            skills: firstMatch.skillsScore,
            location: firstMatch.locationScore,
            experience: firstMatch.experienceScore,
            salary: firstMatch.salaryScore,
            availability: firstMatch.availabilityScore,
          },
          matchedSkills: firstMatch.matchedSkills,
          missingSkills: firstMatch.missingSkills,
          strengths: firstMatch.strengths,
          weaknesses: firstMatch.weaknesses,
          compatibility: {
            meetsMinimumRequirements: firstMatch.meetsMinimumRequirements,
            salaryCompatible: firstMatch.salaryCompatible,
            locationCompatible: firstMatch.locationCompatible,
            availabilityCompatible: firstMatch.availabilityCompatible,
          },
        };
      }
    }

    return res.json({
      stats,
      samples: {
        workers,
        jobs,
        workerWithSkills,
        jobWithSkills,
      },
      topMatches,
      sampleMatchAnalysis,
      diagnosis: {
        hasSkills: stats.skills > 0,
        hasWorkers: stats.workers > 0,
        hasJobs: stats.jobs > 0,
        workersHaveSkills: stats.workerSkills > 0,
        jobsHaveSkills: stats.jobSkillReqs > 0,
        matchesExist: stats.matches > 0,
        readyForMatching:
          stats.skills > 0 &&
          stats.workerSkills > 0 &&
          stats.jobSkillReqs > 0 &&
          stats.workers > 0 &&
          stats.jobs > 0,
      },
      recommendations: getRecommendations(stats),
    });
  } catch (err) {
    console.error("Error en test:", err);
    return res.status(500).json({
      error: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
});

function getRecommendations(stats) {
  const recommendations = [];

  if (stats.skills === 0) {
    recommendations.push(
      "⚠️ No hay skills en la base de datos. Necesitas crear skills primero."
    );
  }

  if (stats.workers === 0) {
    recommendations.push("⚠️ No hay trabajadores registrados.");
  }

  if (stats.jobs === 0) {
    recommendations.push("⚠️ No hay ofertas de trabajo activas.");
  }

  if (stats.workerSkills === 0 && stats.workers > 0) {
    recommendations.push(
      "⚠️ Los trabajadores no tienen skills asignadas. Usa el WorkerSkillManager."
    );
  }

  if (stats.jobSkillReqs === 0 && stats.jobs > 0) {
    recommendations.push(
      "⚠️ Las ofertas no tienen skills requeridas. Añade skills al crear ofertas."
    );
  }

  if (stats.matches === 0 && stats.workers > 0 && stats.jobs > 0) {
    recommendations.push(
      "⚠️ No hay matches calculados. El sistema debería calcularlos automáticamente."
    );
  }

  if (recommendations.length === 0) {
    recommendations.push("✅ Sistema listo. Todo configurado correctamente.");
  }

  return recommendations;
}