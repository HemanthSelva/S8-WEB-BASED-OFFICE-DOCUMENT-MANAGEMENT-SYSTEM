import { Request, Response } from 'express';
import * as userService from '../services/userService';
import { RegisterUserSchema } from '../utils/validation';
import { AuthRequest } from '../middleware/auth';
import { io } from '../app';

/**
 * Create a new user within the admin's organization
 * @route POST /users
 */
export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const data = RegisterUserSchema.parse(req.body);
    
    // Ensure admin creates users only for their own organization
    if (req.user?.organizationId !== data.organizationId) {
       return res.status(403).json({ message: 'Cannot create user for another organization' });
    }

    const user = await userService.createUser(data);
    
    // Emit real-time creation event
    io.to(`org:${data.organizationId}`).emit('user:created', {
      userId: user.id,
      name: user.name,
      role: user.role
    });

    res.status(201).json(user);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Email already exists' });
    }
    res.status(400).json({ message: error.errors || error.message });
  }
};

/**
 * Get all users for the current organization
 * @route GET /users
 */
export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) return res.status(400).json({ message: 'User has no organization' });
    
    const users = await userService.getUsers(orgId);
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update user details
 * @route PUT /users/:id
 */
export const updateUser = async (req: Request, res: Response) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    res.json(user);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Delete a user
 * @route DELETE /users/:id
 */
export const deleteUser = async (req: Request, res: Response) => {
  try {
    await userService.deleteUser(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
