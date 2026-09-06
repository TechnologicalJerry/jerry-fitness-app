import { PrismaClient, SearchHistory, SavedSearch, SearchAnalytics } from '@prisma/client';
import { prismaService } from '../../../database/prisma.service';
import { CreateSavedSearchDto, SearchEntityType } from '../types/search.types';

export class SearchRepository {
  private db: PrismaClient;

  constructor(customPrisma?: PrismaClient) {
    this.db = customPrisma || prismaService;
  }

  // --- Search History ---
  public async addSearchHistory(data: {
    userId: string;
    query: string;
    normalizedQuery: string;
    entityType?: string;
    entityId?: string;
  }): Promise<SearchHistory> {
    return this.db.searchHistory.create({
      data: {
        userId: data.userId,
        query: data.query,
        normalizedQuery: data.normalizedQuery,
        entityType: data.entityType,
        entityId: data.entityId,
      },
    });
  }

  public async getUserRecentSearches(userId: string, limit = 10): Promise<SearchHistory[]> {
    return this.db.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  public async deleteUserRecentSearches(userId: string): Promise<{ count: number }> {
    const res = await this.db.searchHistory.deleteMany({
      where: { userId },
    });
    return { count: res.count };
  }

  // --- Saved Searches ---
  public async createSavedSearch(
    userId: string,
    dto: CreateSavedSearchDto,
  ): Promise<SavedSearch> {
    return this.db.savedSearch.create({
      data: {
        userId,
        name: dto.name,
        query: dto.query,
        filters: dto.filters ? (dto.filters as any) : undefined,
        entityType: dto.entityType || 'GLOBAL',
      },
    });
  }

  public async getSavedSearchesByUser(userId: string): Promise<SavedSearch[]> {
    return this.db.savedSearch.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  public async getSavedSearchById(id: string): Promise<SavedSearch | null> {
    return this.db.savedSearch.findUnique({
      where: { id },
    });
  }

  public async updateSavedSearch(
    id: string,
    data: {
      name?: string;
      query?: string;
      filters?: Record<string, any>;
      entityType?: SearchEntityType;
    },
  ): Promise<SavedSearch> {
    return this.db.savedSearch.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.query ? { query: data.query } : {}),
        ...(data.filters ? { filters: data.filters as any } : {}),
        ...(data.entityType ? { entityType: data.entityType } : {}),
      },
    });
  }

  public async deleteSavedSearch(id: string): Promise<void> {
    await this.db.savedSearch.delete({
      where: { id },
    });
  }

  // --- Search Analytics ---
  public async logAnalytics(data: {
    query: string;
    normalizedQuery: string;
    userId?: string;
    entityType: string;
    resultCount: number;
    selectedEntityId?: string;
    isZeroResult: boolean;
  }): Promise<SearchAnalytics> {
    return this.db.searchAnalytics.create({
      data: {
        query: data.query,
        normalizedQuery: data.normalizedQuery,
        userId: data.userId,
        entityType: data.entityType,
        resultCount: data.resultCount,
        selectedEntityId: data.selectedEntityId,
        isZeroResult: data.isZeroResult,
      },
    });
  }

  public async getZeroResultQueries(limit = 20): Promise<{ normalizedQuery: string; count: number }[]> {
    const raw: any[] = await this.db.$queryRaw`
      SELECT "normalizedQuery", COUNT(*)::int as count
      FROM "search_analytics"
      WHERE "isZeroResult" = true
      GROUP BY "normalizedQuery"
      ORDER BY count DESC
      LIMIT ${limit}
    `;
    return raw.map((r) => ({
      normalizedQuery: r.normalizedQuery,
      count: Number(r.count),
    }));
  }

  public async getPopularQueries(limit = 20): Promise<{ normalizedQuery: string; count: number }[]> {
    const raw: any[] = await this.db.$queryRaw`
      SELECT "normalizedQuery", COUNT(*)::int as count
      FROM "search_analytics"
      GROUP BY "normalizedQuery"
      ORDER BY count DESC
      LIMIT ${limit}
    `;
    return raw.map((r) => ({
      normalizedQuery: r.normalizedQuery,
      count: Number(r.count),
    }));
  }
}

export const searchRepository = new SearchRepository();
