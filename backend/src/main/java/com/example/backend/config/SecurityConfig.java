package com.example.backend.config;

import com.example.backend.security.UserDetailsServiceImpl;
import com.example.backend.service.JwtService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtService jwtService;
    private final UserDetailsServiceImpl userDetailsServiceImpl;

    public SecurityConfig(JwtService jwtService, UserDetailsServiceImpl userDetailsServiceImpl) {
        this.jwtService = jwtService;
        this.userDetailsServiceImpl = userDetailsServiceImpl;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        JwtAuthenticationFilter jwtFilter = new JwtAuthenticationFilter(jwtService, userDetailsServiceImpl);

        http
            .cors() // enable CORS
            .and()
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth

                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/categories/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/payment-methods/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/coupons/**").permitAll()


                .requestMatchers(HttpMethod.GET, "/api/users/**").hasAnyRole("USER", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/users/**").hasAnyRole("USER", "ADMIN")

                .requestMatchers(HttpMethod.DELETE, "/api/users/**").hasRole("ADMIN")

                .requestMatchers(HttpMethod.POST, "/api/categories/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/categories/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/categories/**").hasRole("ADMIN")

                .requestMatchers(HttpMethod.POST, "/api/products/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/products/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/products/**").hasRole("ADMIN")

                .requestMatchers(HttpMethod.POST, "/api/payment-methods/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/payment-methods/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/payment-methods/**").hasRole("ADMIN")

                .requestMatchers(HttpMethod.POST, "/api/coupons/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/coupons/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/coupons/**").hasRole("ADMIN")

                .requestMatchers(HttpMethod.PUT, "/api/payments/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/payments/**").hasRole("ADMIN")

                .requestMatchers(HttpMethod.PUT, "/api/payments/*/status").hasRole("ADMIN")

                .requestMatchers("/api/users/profile").authenticated()

                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
