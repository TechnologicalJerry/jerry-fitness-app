import { StorageProvider } from './storage-provider.interface';
import { s3StorageProvider } from './s3-storage.provider';
import { StorageProviderError } from '../errors/media.errors';

export class StorageManager {
  private providers = new Map<string, StorageProvider>();
  private defaultProviderName = 'S3';

  constructor() {
    this.registerProvider(s3StorageProvider);
  }

  public registerProvider(provider: StorageProvider): void {
    this.providers.set(provider.providerName.toUpperCase(), provider);
  }

  public getProvider(name?: string): StorageProvider {
    const targetName = (name || this.defaultProviderName).toUpperCase();
    const provider = this.providers.get(targetName);

    if (!provider) {
      throw new StorageProviderError(`Storage provider '${name}' is not registered`, targetName);
    }

    return provider;
  }

  public setDefaultProvider(name: string): void {
    const provider = this.getProvider(name);
    this.defaultProviderName = provider.providerName;
  }

  public getDefaultProvider(): StorageProvider {
    return this.getProvider(this.defaultProviderName);
  }
}

export const storageManager = new StorageManager();
