package com.example.backend.service;

import io.jsonwebtoken.*;
import org.springframework.stereotype.Service;
import java.util.Date;

@Service
public class JwtService {

    private final String SECRET_KEY = "N1hWcFhTbU54WjQ3Q1F6Um5qM3ZsOUt4eFdyd3pFaFFqU1lmc2p6UEY1a3R6Wjcz";
    private final long EXPIRATION = 1000 * 60 * 60; // 1h

    public String generateToken(String username) {
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION))
                .signWith(SignatureAlgorithm.HS256, SECRET_KEY)
                .compact();
    }

    public String extractUsername(String token) {
        return Jwts.parser()
                .setSigningKey(SECRET_KEY)
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    public boolean isTokenValid(String token) {
        try {
            Jwts.parser().setSigningKey(SECRET_KEY).parseClaimsJws(token);
            return true;
        } catch (JwtException e) {
            return false;
        }
    }
}
