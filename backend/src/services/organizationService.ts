import prisma from '../utils/prisma';

export const createOrganization = async (name: string, domain?: string) => {
  return prisma.organization.create({
    data: {
      name,
      domain,
    },
  });
};

export const getOrganizationById = async (id: string) => {
  return prisma.organization.findUnique({
    where: { id },
    include: { users: { select: { id: true, name: true, email: true, role: true } } },
  });
};
