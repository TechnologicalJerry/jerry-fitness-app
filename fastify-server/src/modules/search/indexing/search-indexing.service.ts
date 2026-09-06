import { searchEngine } from '../engines/search.engine';
import { SearchEntityType } from '../types/search.types';
import { logger } from '../../../observability/logger';
import { backgroundQueueService } from '../../../jobs/queue.service';

export class SearchIndexingService {
  public async handleEntityChange(
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    entityType: SearchEntityType,
    entityId: string,
  ): Promise<void> {
    try {
      if (action === 'CREATE') {
        await searchEngine.index(entityType, entityId);
      } else if (action === 'UPDATE') {
        await searchEngine.update(entityType, entityId);
      } else if (action === 'DELETE') {
        await searchEngine.remove(entityType, entityId);
      }
    } catch (error) {
      logger.error(
        { err: error, action, entityType, entityId },
        'Search indexing background handler failed',
      );
      // Indexing failure MUST NOT corrupt primary database state or throw synchronously
    }
  }

  public async triggerFullReindex(entityType?: SearchEntityType): Promise<{ jobId: string }> {
    const jobId = backgroundQueueService.enqueueJob('SEARCH_FULL_REINDEX', { entityType });
    return { jobId };
  }

  public async executeFullReindex(entityType?: SearchEntityType): Promise<{ processed: number; errors: number }> {
    logger.info({ entityType }, 'Starting full search reindex operation');
    const result = await searchEngine.rebuild(entityType);
    logger.info({ entityType, result }, 'Completed full search reindex operation');
    return result;
  }
}

export const searchIndexingService = new SearchIndexingService();
