/**
 * Service de gestion des produits (Products) - Sprint 4
 *
 * Gère les opérations CRUD sur les produits
 * Validation avec enseigne active
 */

import { PrismaClient, Product } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateProductInput {
  brandId: string;
  name: string;
  category: string;
  barcode?: string;
  description?: string;
  imageUrl?: string;
}

export interface UpdateProductInput {
  name?: string;
  category?: string;
  barcode?: string;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
}

export interface ProductSearchFilters {
  brandId?: string;
  category?: string;
  barcode?: string;
  search?: string;
  isActive?: boolean;
}

export class ProductService {
  async create(input: CreateProductInput): Promise<Product> {
    // Vérifier que la brand existe et est ACTIVE
    const brand = await prisma.brand.findUnique({ where: { id: input.brandId } });
    if (!brand || brand.status !== 'ACTIVE') {
      throw new Error('Enseigne introuvable ou non active');
    }

    return prisma.product.create({
      data: input,
      include: { brand: true },
    });
  }

  async findById(id: string): Promise<Product | null> {
    return prisma.product.findUnique({
      where: { id },
      include: { brand: true, prices: true },
    });
  }

  async search(
    filters: ProductSearchFilters = {},
    page = 1,
    limit = 20
  ): Promise<{ products: Product[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * Math.min(limit, 100);
    const take = Math.min(limit, 100);

    const where: any = {};
    if (filters.brandId) where.brandId = filters.brandId;
    if (filters.category) where.category = filters.category;
    if (filters.barcode) where.barcode = filters.barcode;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { brand: true },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    return { products, total, page, totalPages: Math.ceil(total / take) };
  }

  async update(id: string, input: UpdateProductInput): Promise<Product> {
    return prisma.product.update({
      where: { id },
      data: input,
      include: { brand: true },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.product.delete({ where: { id } });
  }

  async getStatistics(): Promise<{
    total: number;
    active: number;
    byCategory: Record<string, number>;
  }> {
    const [total, active, categories] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.groupBy({
        by: ['category'],
        _count: true,
      }),
    ]);

    const byCategory: Record<string, number> = {};
    categories.forEach((cat) => {
      byCategory[cat.category] = cat._count;
    });

    return { total, active, byCategory };
  }
}

export default new ProductService();
