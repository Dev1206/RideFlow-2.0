interface CacheItem<T> {
  value: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheConfig {
  defaultTTL: number;
  maxSize: number;
  cleanupInterval: number;
}

class Cache<T> {
  private cache: Map<string, CacheItem<T>>;
  private config: CacheConfig;
  private cleanupTimer: NodeJS.Timeout;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 5 * 60 * 1000,
      maxSize: 1000,
      cleanupInterval: 60 * 1000,
      ...config
    };

    this.cache = new Map();
    this.cleanupTimer = this.startCleanup();
  }

  set(key: string, value: T, ttl?: number): void {
    const timestamp = Date.now();
    const expiresAt = timestamp + (ttl || this.config.defaultTTL);

    if (this.cache.size >= this.config.maxSize) {
      this.removeOldest();
    }

    this.cache.set(key, {
      value,
      timestamp,
      expiresAt
    });
  }

  get<R extends T>(key: string): R | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value as R;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private removeOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;

    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTimestamp) {
        oldestKey = key;
        oldestTimestamp = item.timestamp;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  private startCleanup(): NodeJS.Timeout {
    return setInterval(
      () => this.cleanup(),
      this.config.cleanupInterval
    );
  }

  destroy(): void {
    clearInterval(this.cleanupTimer);
  }
}

// Create cache instances for different types of data
export const trafficCache = new Cache<any>({
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxSize: 100
});

export const routeCache = new Cache<any>({
  defaultTTL: 15 * 60 * 1000, // 15 minutes
  maxSize: 500
});

export const groupCache = new Cache<any>({
  defaultTTL: 30 * 60 * 1000, // 30 minutes
  maxSize: 200
});

// Cache key generators
export function generateTrafficCacheKey(coordinates: { lat: number; lng: number }[]): string {
  return `traffic:${coordinates.map(c => `${c.lat},${c.lng}`).join('|')}`;
}

export function generateRouteCacheKey(waypoints: { lat: number; lng: number }[]): string {
  return `route:${waypoints.map(w => `${w.lat},${w.lng}`).join('|')}`;
}

export function generateGroupCacheKey(rideIds: string[]): string {
  return `group:${rideIds.sort().join(',')}`;
}

// Memoization decorator
export function memoize<T>(
  ttl: number = 5 * 60 * 1000 // 5 minutes default
) {
  return function (
    _target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const cache = new Cache<T>({ defaultTTL: ttl });

    descriptor.value = function (...args: any[]) {
      const key = `${propertyKey}:${JSON.stringify(args)}`;
      const cached = cache.get(key);
      
      if (cached !== null) {
        return cached;
      }

      const value = originalMethod.apply(this, args);
      
      // Cache the result if it's a value or a resolved promise
      if (value instanceof Promise) {
        return value.then(resolvedValue => {
          cache.set(key, resolvedValue);
          return resolvedValue;
        });
      } else {
        cache.set(key, value);
        return value;
      }
    };

    return descriptor;
  };
}

// Performance monitoring
interface PerformanceMetrics {
  startTime: number;
  endTime: number;
  duration: number;
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
  };
}

export function measurePerformance(operation: () => any): PerformanceMetrics {
  const startTime = performance.now();
  const startMemory = (performance as any).memory?.usedJSHeapSize;

  operation();

  const endTime = performance.now();
  const endMemory = (performance as any).memory?.usedJSHeapSize;

  const metrics: PerformanceMetrics = {
    startTime,
    endTime,
    duration: endTime - startTime
  };

  if (startMemory !== undefined && endMemory !== undefined) {
    metrics.memory = {
      usedJSHeapSize: endMemory - startMemory,
      totalJSHeapSize: (performance as any).memory.totalJSHeapSize
    };
  }

  return metrics;
}

// Example usage:
// class RouteService {
//   @memoize(5 * 60 * 1000)
//   async calculateRoute(waypoints: any[]) {
//     // Expensive calculation...
//   }
// } 