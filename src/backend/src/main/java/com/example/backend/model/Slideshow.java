package com.example.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "slide_shows")
@Data // Lombok getter/setter
@NoArgsConstructor
@AllArgsConstructor
public class Slideshow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String imageUrl;

    private String title;

    private String description;

    private String targetUrl;

    private Integer sortOrder;

    private Boolean active = true;
}