package com.security.admin.service;

import com.security.admin.dto.SessionDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Service
public class RedisSessionService {

    @Autowired(required = false)
    private RedisTemplate<String, Object> redisTemplate;

    // Fallback in-memory map in case Redis is not running locally
    private final Map<String, SessionDto> localFallbackStore = new ConcurrentHashMap<>();
    private final Map<String, Long> localFallbackExpiry = new ConcurrentHashMap<>();

    public boolean isRedisAvailable() {
        if (redisTemplate == null) return false;
        try {
            // Send a ping command
            redisTemplate.getConnectionFactory().getConnection().ping();
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    // 1. Get all active sessions
    public List<SessionDto> getAllActiveSessions() {
        if (isRedisAvailable()) {
            try {
                Set<String> keys = redisTemplate.keys("session:*");
                if (keys == null || keys.isEmpty()) return Collections.emptyList();
                
                List<SessionDto> sessions = new ArrayList<>();
                for (String key : keys) {
                    SessionDto session = (SessionDto) redisTemplate.opsForValue().get(key);
                    if (session != null) {
                        Long expire = redisTemplate.getExpire(key, TimeUnit.MINUTES);
                        session.setExpiresIn(expire != null && expire > 0 ? expire : 0);
                        sessions.add(session);
                    }
                }
                return sessions;
            } catch (Exception e) {
                // fallback if query errors out
            }
        }
        
        // Return local fallback store
        List<SessionDto> sessions = new ArrayList<>();
        long now = System.currentTimeMillis();
        for (String key : new ArrayList<>(localFallbackStore.keySet())) {
            Long expiryTime = localFallbackExpiry.get(key);
            if (expiryTime != null && expiryTime < now) {
                // Clean up expired local session
                localFallbackStore.remove(key);
                localFallbackExpiry.remove(key);
            } else {
                SessionDto session = localFallbackStore.get(key);
                if (session != null) {
                    long remainingMin = expiryTime != null ? (expiryTime - now) / 60000 : 120;
                    session.setExpiresIn(remainingMin);
                    sessions.add(session);
                }
            }
        }
        return sessions;
    }

    // 2. Save session
    public void saveSession(SessionDto session) {
        String key = "session:" + session.getId();
        if (isRedisAvailable()) {
            try {
                redisTemplate.opsForValue().set(key, session, 120, TimeUnit.MINUTES);
                return;
            } catch (Exception e) {
                // fallback
            }
        }
        
        // Save to local fallback store
        localFallbackStore.put(session.getId(), session);
        localFallbackExpiry.put(session.getId(), System.currentTimeMillis() + (120L * 60L * 1000L));
    }

    // 3. Renew session TTL
    public void renewSessionTtl(String id) {
        String key = "session:" + id;
        if (isRedisAvailable()) {
            try {
                redisTemplate.expire(key, 120, TimeUnit.MINUTES);
                SessionDto session = (SessionDto) redisTemplate.opsForValue().get(key);
                if (session != null) {
                    session.setExpiresIn(120);
                    redisTemplate.opsForValue().set(key, session, 120, TimeUnit.MINUTES);
                }
                return;
            } catch (Exception e) {
                // fallback
            }
        }
        
        // Renew locally
        SessionDto session = localFallbackStore.get(id);
        if (session != null) {
            session.setExpiresIn(120);
            localFallbackExpiry.put(id, System.currentTimeMillis() + (120L * 60L * 1000L));
        }
    }

    // 4. Force Terminate session (Delete key)
    public void deleteSession(String id) {
        String key = "session:" + id;
        if (isRedisAvailable()) {
            try {
                redisTemplate.delete(key);
                return;
            } catch (Exception e) {
                // fallback
            }
        }
        
        // Delete locally
        localFallbackStore.remove(id);
        localFallbackExpiry.remove(id);
    }
}
