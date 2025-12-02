async function getCurrentUser() {
  try {
    const docsPath = await Neutralino.os.getPath("documents");
    const userPath = `${docsPath}/BCULMS/data/user.json`.replace(/\\/g, "/");
    try {
      const content = await Neutralino.filesystem.readFile(userPath);
      const user = JSON.parse(content);
      if (user && user.id && user.role) return user;
    } catch (_) {}
  } catch (_) {}
  return { id: "staff-default", role: "Admin", name: "Default Admin" };
}

async function requireRole(allowedRoles = ["Admin", "Librarian"]) {
  const user = await getCurrentUser();
  if (!allowedRoles.includes(user.role)) {
    throw new Error("Unauthorized: insufficient role");
  }
  return user;
}

if (typeof window !== "undefined") {
  window.getCurrentUser = getCurrentUser;
  window.requireRole = requireRole;
}
