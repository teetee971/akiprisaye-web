/**
 * Service de gestion des produits (Products) - Sprint 4
 *
 * Gère les opérations CRUD sur les produits
 * Aligné sur le schéma Prisma réel (Product sans relation brand/prices)
 */

import { PrismaClient } from '@prisma/client';
import type { Product } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateProductInput {
  productKey: string;
  displayName: string;
  rawLabel: string;
  normalizedLabel: string;
  brand?: string;
  category?: string;
  subcategory?: string;
  barcode?: string;
  primaryImageUrl?: string;
}

export interface UpdateProductInput {
  displayName?: string;
  rawLabel?: string;
  normalizedLabel?: string;
  brand?: string;
  category?: string;
  subcategory?: string;
  barcode?: string;
  primaryImageUrl?: string;
}

export interface ProductSearchFilters {
  brand?: string;
  category?: string;
  barcode?: string;
  search?: string;
}

export class ProductService {
  async create(input: CreateProductInput): Promise<Product> {
    return prisma.product.create({
      data: input,
    });
  }

  async findById(id: string): Promise<Product | null> {
    return prisma.product.findUnique({
      where: { id },
    });
  }

  async search(
    filters: ProductSearchFilters = {},
    page = 1,
    limit = 20
  ): Promise<{ products: Product[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * Math.min(limit, 100);
    const take = Math.min(limit, 100);

    const where: Record<string, unknown> = {};
    if (filters.brand) where.brand = filters.brand;
    if (filters.category) where.category = filters.category;
    if (filters.barcode) where.barcode = filters.barcode;
    if (filters.search) {
      where.OR = [
        { displayName: { contains: filters.search, mode: 'insensitive' } },
        { normalizedLabel: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
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
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.product.delete({ where: { id } });
  }

  async getStatistics(): Promise<{
    total: number;
    byCategory: Record<string, number>;
  }> {
    const [total, categories] = await Promise.all([
      prisma.product.count(),
      prisma.product.groupBy({
        by: ['category'],
        _count: true,
      }),
    ]);

    const byCategory: Record<string, number> = {};
    categories.forEach((cat) => {
      if (cat.category !== null) {
        byCategory[cat.category] = cat._count;
      }
    });

    return { total, byCategory };
  }
}

export default new ProductService();
