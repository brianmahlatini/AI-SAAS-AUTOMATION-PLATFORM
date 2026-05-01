import { pgPool } from "../../database/postgres";

export type UserRole = "USER" | "ADMIN";

export type AppUser = {
  id: string;
  email?: string;
  displayName?: string;
  role: UserRole;
};

export async function upsertUser(user: AppUser): Promise<AppUser> {
  const result = await pgPool.query(
    `
      INSERT INTO app_users (id, email, display_name, role, updated_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (id) DO UPDATE SET
        email = COALESCE(EXCLUDED.email, app_users.email),
        display_name = COALESCE(EXCLUDED.display_name, app_users.display_name),
        role = CASE
          WHEN app_users.role = 'ADMIN' THEN 'ADMIN'
          ELSE EXCLUDED.role
        END,
        updated_at = NOW()
      RETURNING id, email, display_name, role
    `,
    [user.id, user.email ?? null, user.displayName ?? null, user.role]
  );

  const row = result.rows[0];
  return {
    id: row.id,
    email: row.email ?? undefined,
    displayName: row.display_name ?? undefined,
    role: row.role
  };
}

export async function findUserById(id: string): Promise<AppUser | null> {
  const result = await pgPool.query(
    "SELECT id, email, display_name, role FROM app_users WHERE id = $1",
    [id]
  );
  const row = result.rows[0];
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    email: row.email ?? undefined,
    displayName: row.display_name ?? undefined,
    role: row.role
  };
}

export async function countUsers(): Promise<number> {
  const result = await pgPool.query("SELECT COUNT(*)::int AS count FROM app_users");
  return result.rows[0]?.count ?? 0;
}
