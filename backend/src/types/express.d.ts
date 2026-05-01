declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        role: "USER" | "ADMIN";
        email?: string;
        displayName?: string;
      };
    }
  }
}

export {};
