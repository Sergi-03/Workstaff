export const roleMiddleware = (rolesPermitidos = []) => {
  return (req, res, next) => {
    const role = req.appUser?.role; 
    if (!role || !rolesPermitidos.includes(role)) {
      return res.status(403).json({ error: "Acceso denegado" });
    }
    next();
  };
};
