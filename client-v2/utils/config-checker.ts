// Configuration and service health checker
import axios from 'axios';

export interface ServiceStatus {
  name: string;
  url: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  responseTime?: number;
  error?: string;
}

export interface ConfigStatus {
  services: ServiceStatus[];
  environment: 'development' | 'production' | 'test';
  missingEnvVars: string[];
}

class ConfigChecker {
  private requiredEnvVars = [
    'NEXT_PUBLIC_API_BASE_URL',
    'NEXT_PUBLIC_BACKEND_URL',
  ];

  private services = [
    {
      name: 'Backend API',
      url: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api',
      healthEndpoint: '/health'
    },
    {
      name: 'Past Papers API',
      url: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api',
      healthEndpoint: '/pastpapers'
    }
  ];

  async checkServiceHealth(service: { name: string; url: string; healthEndpoint: string }): Promise<ServiceStatus> {
    const startTime = Date.now();
    
    try {
      const response = await axios.get(`${service.url}${service.healthEndpoint}`, {
        timeout: 5000,
        validateStatus: (status) => status < 500 // Accept 4xx as healthy (server is responding)
      });
      
      const responseTime = Date.now() - startTime;
      
      return {
        name: service.name,
        url: service.url,
        status: 'healthy',
        responseTime
      };
    } catch (error: any) {
      return {
        name: service.name,
        url: service.url,
        status: 'unhealthy',
        error: error.message || 'Unknown error'
      };
    }
  }

  checkEnvironmentVariables(): string[] {
    const missing: string[] = [];
    
    this.requiredEnvVars.forEach(envVar => {
      if (!process.env[envVar]) {
        missing.push(envVar);
      }
    });
    
    return missing;
  }

  getEnvironment(): 'development' | 'production' | 'test' {
    const nodeEnv = process.env.NODE_ENV || 'development';
    if (nodeEnv === 'production') return 'production';
    if (nodeEnv === 'test') return 'test';
    return 'development';
  }

  async checkAllServices(): Promise<ConfigStatus> {
    const missingEnvVars = this.checkEnvironmentVariables();
    
    const servicePromises = this.services.map(service => 
      this.checkServiceHealth(service)
    );
    
    const services = await Promise.all(servicePromises);
    
    return {
      services,
      environment: this.getEnvironment(),
      missingEnvVars
    };
  }

  logStatus(status: ConfigStatus) {
    console.group('🔧 SyllaBuzz Configuration Status');
    
    console.log(`Environment: ${status.environment}`);
    
    if (status.missingEnvVars.length > 0) {
      console.warn('Missing environment variables:', status.missingEnvVars);
    } else {
      console.log('✅ All required environment variables are set');
    }
    
    console.group('Services Status:');
    status.services.forEach(service => {
      const statusIcon = service.status === 'healthy' ? '✅' : '❌';
      const responseTime = service.responseTime ? ` (${service.responseTime}ms)` : '';
      console.log(`${statusIcon} ${service.name}: ${service.status}${responseTime}`);
      
      if (service.error) {
        console.error(`   Error: ${service.error}`);
      }
    });
    console.groupEnd();
    
    console.groupEnd();
  }

  async runHealthCheck(logResults: boolean = true): Promise<ConfigStatus> {
    const status = await this.checkAllServices();
    
    if (logResults) {
      this.logStatus(status);
    }
    
    return status;
  }
}

export const configChecker = new ConfigChecker();
export default configChecker;