declare global {
  namespace Express {
    interface UserPayload {
      id: string;
      role: string;
      email?: string;
      provider?: string;
    }

    interface Request {
      user?: UserPayload;
    }
  }
}

export {};
