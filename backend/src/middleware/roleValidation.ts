import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';

export const authorizeRoles = (...roles: Role[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user;

        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'Authentication required'
            });
        }

        if (!roles.includes(user.role)) {
            return res.status(403).json({
                status: 'error',
                message: `Access denied. Requires one of the following roles: ${roles.join(', ')}`
            });
        }

        next();
    };
};
