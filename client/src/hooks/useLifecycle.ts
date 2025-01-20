import { useEffect, useRef } from 'react';

export function useLifecycle(componentName: string) {
  const mountTime = useRef(Date.now());

  useEffect(() => {
    const mountDuration = Date.now() - mountTime.current;
    console.log(`[Lifecycle] ${componentName} mounted in ${mountDuration}ms`);

    return () => {
      const unmountTime = Date.now();
      const lifetime = unmountTime - mountTime.current;
      console.log(`[Lifecycle] ${componentName} unmounted after ${lifetime}ms`);
    };
  }, [componentName]);
}
