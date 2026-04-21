import type { StorageDriver } from '@compgit/shared';
import { useEffect, useState } from 'react';

export function useStorageValue<T>(
  driver: StorageDriver,
  key: string,
): { value: T | null; loading: boolean } {
  const [value, setValue] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    driver.get<T>(key).then((initial) => {
      if (cancelled) return;
      setValue(initial);
      setLoading(false);
    });
    const unsubscribe = driver.subscribe<T>(key, (next) => {
      setValue(next);
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [driver, key]);

  return { value, loading };
}
