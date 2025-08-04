'use client';

import { useEffect } from 'react';
import { configChecker } from '@/utils/config-checker';

export const ConfigInitializer = () => {
  useEffect(() => {
    // Run configuration and service health check on app initialization
    const initConfig = async () => {
      try {
        await configChecker.runHealthCheck(true);
      } catch (error) {
        console.error('Configuration check failed:', error);
      }
    };

    initConfig();
  }, []);

  // This component doesn't render anything
  return null;
};

export default ConfigInitializer;