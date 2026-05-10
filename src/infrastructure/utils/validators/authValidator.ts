import { body } from 'express-validator';

export const registerValidator = [
  body('email').isEmail().withMessage('Invalid email address'),

  body('password').isLength({ min: 4 }).withMessage('Password must be at least 6 characters'),
];
