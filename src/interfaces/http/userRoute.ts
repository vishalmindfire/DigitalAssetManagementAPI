import bcrypt from 'bcryptjs';
import { Request, Response, Router } from 'express';
import jwt from 'jsonwebtoken';

import { UserRepository } from '#domain/repositories/userRepository.js';
import { checkAuth } from '#infrastructure/middlewares/auth.js';
import { registerValidator } from '#infrastructure/utils/validators/authValidator.js';
import { validate } from '#infrastructure/middlewares/validation.js';

const COOKIE_NAME = 'access_token';
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('Missing environment variable: JWT_SECRET');
  return secret;
}

export function createUserRoute(userRepo: UserRepository) {
  const router = Router();

  router.post('/login', registerValidator, validate, async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body as { email: string; password: string };

      if (!email || !password) {
        res.status(400).json({ message: 'Email and password are required' });
        return;
      }

      const user = await userRepo.findByEmail(email);
      if (!user || !(await bcrypt.compare(password, user.getPasswordHash()))) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
      }

      const token = jwt.sign(
        {
          email: user.getEmail(),
          id: user.getId(),
          role: user.getRole(),
        },
        getJwtSecret(),
        { expiresIn: '7d' }
      );

      res
        .cookie(COOKIE_NAME, token, {
          httpOnly: true,
          maxAge: COOKIE_MAX_AGE_MS,
          sameSite: 'none',
          secure: true,
        })
        .json(user.toProfile());
    } catch (err) {
      res.status(500).json({ message: err instanceof Error ? err.message : 'Login failed' });
    }
  });

  router.post('/logout', (_req: Request, res: Response) => {
    res
      .clearCookie(COOKIE_NAME, {
        httpOnly: true,
        sameSite: 'none',
        secure: true,
      })
      .json({ message: 'Logged out' });
  });

  router.post('/checkAuth', checkAuth, async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const user = await userRepo.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json(user.toProfile());
  });

  return router;
}
