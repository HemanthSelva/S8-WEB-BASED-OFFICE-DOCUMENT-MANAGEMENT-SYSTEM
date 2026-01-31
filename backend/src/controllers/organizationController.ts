import { Request, Response } from 'express';
import * as orgService from '../services/organizationService';
import { CreateOrgSchema } from '../utils/validation';

/**
 * Create a new organization
 * @route POST /organizations
 */
export const createOrg = async (req: Request, res: Response) => {
  try {
    const data = CreateOrgSchema.parse(req.body);
    const org = await orgService.createOrganization(data.name, data.domain);
    res.status(201).json(org);
  } catch (error: any) {
    res.status(400).json({ message: error.errors || error.message });
  }
};

/**
 * Get organization details by ID
 * @route GET /organizations/:id
 */
export const getOrg = async (req: Request, res: Response) => {
  try {
    const org = await orgService.getOrganizationById(req.params.id);
    if (!org) {
      return res.status(404).json({ message: 'Organization not found' });
    }
    res.json(org);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
