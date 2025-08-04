# server/app/utils/cache.py
# Caching utilities using Redis

import redis
import json
import pickle
import hashlib
from functools import wraps
from datetime import datetime, timedelta
import os
import logging

logger = logging.getLogger(__name__)

class CacheService:
    """Redis-based caching service"""
    
    def __init__(self):
        self.redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
        self.default_ttl = int(os.environ.get('CACHE_DEFAULT_TTL', 3600))  # 1 hour
        
        try:
            self.redis_client = redis.from_url(self.redis_url, decode_responses=True)
            # Test connection
            self.redis_client.ping()
            self.available = True
            logger.info("Redis cache service initialized successfully")
        except Exception as e:
            logger.warning(f"Redis cache service unavailable: {str(e)}")
            self.redis_client = None
            self.available = False
    
    def _make_key(self, key, prefix='cache'):
        """Create a standardized cache key"""
        if not isinstance(key, str):
            key = str(key)
        return f"{prefix}:{key}"
    
    def get(self, key, default=None):
        """Get value from cache"""
        if not self.available:
            return default
        
        try:
            cache_key = self._make_key(key)
            value = self.redis_client.get(cache_key)
            
            if value is None:
                return default
            
            # Try to deserialize JSON first, then pickle
            try:
                return json.loads(value)
            except (json.JSONDecodeError, TypeError):
                try:
                    return pickle.loads(value.encode('latin-1'))
                except:
                    return value
        except Exception as e:
            logger.error(f"Cache get error for key {key}: {str(e)}")
            return default
    
    def set(self, key, value, ttl=None):
        """Set value in cache"""
        if not self.available:
            return False
        
        try:
            cache_key = self._make_key(key)
            ttl = ttl or self.default_ttl
            
            # Try to serialize as JSON first, then pickle
            try:
                serialized_value = json.dumps(value)
            except (TypeError, ValueError):
                try:
                    serialized_value = pickle.dumps(value).decode('latin-1')
                except:
                    serialized_value = str(value)
            
            return self.redis_client.setex(cache_key, ttl, serialized_value)
        except Exception as e:
            logger.error(f"Cache set error for key {key}: {str(e)}")
            return False
    
    def delete(self, key):
        """Delete key from cache"""
        if not self.available:
            return False
        
        try:
            cache_key = self._make_key(key)
            return self.redis_client.delete(cache_key) > 0
        except Exception as e:
            logger.error(f"Cache delete error for key {key}: {str(e)}")
            return False
    
    def delete_pattern(self, pattern):
        """Delete all keys matching pattern"""
        if not self.available:
            return 0
        
        try:
            cache_pattern = self._make_key(pattern)
            keys = self.redis_client.keys(cache_pattern)
            if keys:
                return self.redis_client.delete(*keys)
            return 0
        except Exception as e:
            logger.error(f"Cache delete pattern error for {pattern}: {str(e)}")
            return 0
    
    def exists(self, key):
        """Check if key exists in cache"""
        if not self.available:
            return False
        
        try:
            cache_key = self._make_key(key)
            return self.redis_client.exists(cache_key) > 0
        except Exception as e:
            logger.error(f"Cache exists error for key {key}: {str(e)}")
            return False
    
    def increment(self, key, amount=1, ttl=None):
        """Increment a numeric value"""
        if not self.available:
            return amount
        
        try:
            cache_key = self._make_key(key)
            result = self.redis_client.incr(cache_key, amount)
            
            if ttl:
                self.redis_client.expire(cache_key, ttl)
            
            return result
        except Exception as e:
            logger.error(f"Cache increment error for key {key}: {str(e)}")
            return amount
    
    def get_or_set(self, key, callable_func, ttl=None):
        """Get from cache or set using callable function"""
        value = self.get(key)
        
        if value is None:
            value = callable_func()
            self.set(key, value, ttl)
        
        return value

# Global cache instance
cache = CacheService()

def cached(ttl=None, key_func=None):
    """Decorator for caching function results"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            if key_func:
                cache_key = key_func(*args, **kwargs)
            else:
                # Create key from function name and arguments
                key_parts = [func.__name__]
                key_parts.extend(str(arg) for arg in args)
                key_parts.extend(f"{k}:{v}" for k, v in sorted(kwargs.items()))
                cache_key = hashlib.md5(":".join(key_parts).encode()).hexdigest()
            
            # Try to get from cache
            result = cache.get(cache_key)
            if result is not None:
                return result
            
            # Execute function and cache result
            result = func(*args, **kwargs)
            cache.set(cache_key, result, ttl)
            return result
        
        # Add cache control methods to function
        wrapper.cache_delete = lambda *args, **kwargs: cache.delete(
            key_func(*args, **kwargs) if key_func else 
            hashlib.md5(":".join([func.__name__] + [str(arg) for arg in args] + 
                               [f"{k}:{v}" for k, v in sorted(kwargs.items())]).encode()).hexdigest()
        )
        
        return wrapper
    return decorator

def cache_key_for_user(user_id, action, *args):
    """Generate cache key for user-specific actions"""
    key_parts = [f"user:{user_id}", action]
    key_parts.extend(str(arg) for arg in args)
    return ":".join(key_parts)

def cache_key_for_resource(resource_type, resource_id, action=None):
    """Generate cache key for resource-specific actions"""
    key_parts = [resource_type, str(resource_id)]
    if action:
        key_parts.append(action)
    return ":".join(key_parts)

def invalidate_user_cache(user_id):
    """Invalidate all cache entries for a user"""
    pattern = f"user:{user_id}:*"
    return cache.delete_pattern(pattern)

def invalidate_resource_cache(resource_type, resource_id):
    """Invalidate all cache entries for a resource"""
    pattern = f"{resource_type}:{resource_id}:*"
    return cache.delete_pattern(pattern)

# Rate limiting using cache
class RateLimiter:
    """Redis-based rate limiter"""
    
    def __init__(self, cache_service=None):
        self.cache = cache_service or cache
    
    def is_allowed(self, key, limit, window_seconds):
        """Check if action is allowed within rate limit"""
        if not self.cache.available:
            return True  # Allow if cache is not available
        
        try:
            current_count = self.cache.get(key, 0)
            
            if current_count >= limit:
                return False
            
            # Increment counter
            new_count = self.cache.increment(key, ttl=window_seconds)
            return new_count <= limit
            
        except Exception as e:
            logger.error(f"Rate limiter error for key {key}: {str(e)}")
            return True  # Allow on error
    
    def get_remaining(self, key, limit):
        """Get remaining requests for the time window"""
        if not self.cache.available:
            return limit
        
        try:
            current_count = self.cache.get(key, 0)
            return max(0, limit - current_count)
        except Exception as e:
            logger.error(f"Rate limiter get remaining error for key {key}: {str(e)}")
            return limit

# Global rate limiter instance
rate_limiter = RateLimiter()