export const ADMIN_SESSION_COOKIE = "em_admin_session";
export const ADMIN_LOGIN_PATH = "/admin/login";

export const bootstrapAdmin = {
  email: process.env.BOOTSTRAP_ADMIN_EMAIL ?? "",
  password: process.env.BOOTSTRAP_ADMIN_PASSWORD ?? ""
};
