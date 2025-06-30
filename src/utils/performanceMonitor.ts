/**
 * Performance monitoring utilities for tracking slow operations
 */

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private timers = new Map<string, number>();
  private metadata = new Map<string, Record<string, any>>();

  /**
   * Start timing an operation
   */
  start(name: string, metadata?: Record<string, any>) {
    const startTime = performance.now();
    this.timers.set(name, startTime);
    if (metadata) {
      this.metadata.set(name, metadata);
    }
  }

  /**
   * End timing an operation and record the metric
   */
  end(name: string) {
    const endTime = performance.now();
    const startTime = this.timers.get(name);
    const operationMetadata = this.metadata.get(name);
    
    if (startTime) {
      const duration = endTime - startTime;
      const metric: PerformanceMetric = {
        name,
        duration,
        timestamp: Date.now(),
        metadata: operationMetadata
      };
      
      this.metrics.push(metric);
      this.timers.delete(name);
      this.metadata.delete(name);
      
      // Log slow operations (> 100ms)
      if (duration > 100) {
        console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`, operationMetadata);
      }
      
      return metric;
    }
    
    return null;
  }

  /**
   * Get performance metrics
   */
  getMetrics(filterName?: string): PerformanceMetric[] {
    if (filterName) {
      return this.metrics.filter(m => m.name.includes(filterName));
    }
    return [...this.metrics];
  }

  /**
   * Get slowest operations
   */
  getSlowestOperations(limit = 10): PerformanceMetric[] {
    return [...this.metrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  /**
   * Clear metrics
   */
  clear() {
    this.metrics = [];
    this.timers.clear();
    this.metadata.clear();
  }

  /**
   * Get average duration for operations with the same name
   */
  getAverageDuration(name: string): number {
    const operations = this.metrics.filter(m => m.name === name);
    if (operations.length === 0) return 0;
    
    const total = operations.reduce((sum, op) => sum + op.duration, 0);
    return total / operations.length;
  }
}

// Global instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Decorator for async functions to automatically track performance
 */
export function trackPerformance(name?: string) {
  return function <T extends (...args: any[]) => Promise<any>>(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const originalMethod = descriptor.value!;
    const operationName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (this: any, ...args: any[]) {
      performanceMonitor.start(operationName, { args: args.length });
      try {
        const result = await originalMethod.apply(this, args);
        return result;
      } finally {
        performanceMonitor.end(operationName);
      }
    } as T;

    return descriptor;
  };
}

/**
 * Hook for tracking React component render performance
 */
export function useRenderPerformance(componentName: string) {
  const renderCount = React.useRef(0);
  const lastRenderTime = React.useRef(0);

  React.useEffect(() => {
    renderCount.current += 1;
    const now = performance.now();
    
    if (lastRenderTime.current > 0) {
      const timeSinceLastRender = now - lastRenderTime.current;
      
      // Log if re-renders are happening too frequently (< 16ms apart)
      if (timeSinceLastRender < 16) {
        console.warn(`Frequent re-render detected in ${componentName}: ${timeSinceLastRender.toFixed(2)}ms since last render`);
      }
    }
    
    lastRenderTime.current = now;
  });

  React.useEffect(() => {
    return () => {
     // console.log(`${componentName} rendered ${renderCount.current} times during its lifecycle`);
    };
  }, [componentName]);
}

// Make React available for the hook
import React from 'react';
