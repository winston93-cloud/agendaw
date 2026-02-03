'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'

const slides = [
  { id: 1, image: '/1.jpg', alt: 'Estudiantes en evento formal' },
  { id: 2, image: '/2.jpg', alt: 'Actividad de cocina' },
  { id: 3, image: '/3.jpg', alt: 'Equipo deportivo Lions' },
  { id: 4, image: '/4.jpg', alt: 'Vida escolar Winston' },
  { id: 5, image: '/5.jpg', alt: 'Comunidad Winston' },
]

export default function Carousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length)
  }, [])

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
    setIsPlaying(false)
  }

  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      nextSlide()
    }, 4000)

    return () => clearInterval(interval)
  }, [isPlaying, nextSlide])

  return (
    <div className="carousel-container">
      <div className="carousel">
        {/* Slides */}
        <div className="carousel-track">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`carousel-slide ${index === currentIndex ? 'active' : ''} ${
                index === currentIndex - 1 || 
                (currentIndex === 0 && index === slides.length - 1) 
                  ? 'prev' 
                  : ''
              } ${
                index === currentIndex + 1 || 
                (currentIndex === slides.length - 1 && index === 0) 
                  ? 'next' 
                  : ''
              }`}
            >
              <Image
                src={slide.image}
                alt={slide.alt}
                fill
                className="carousel-image"
                priority={index === 0}
                quality={90}
              />
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="carousel-arrow carousel-arrow-left"
          aria-label="Anterior"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M15 18l-6-6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <button
          onClick={nextSlide}
          className="carousel-arrow carousel-arrow-right"
          aria-label="Siguiente"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M9 18l6-6-6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Play/Pause Button */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="carousel-play-button"
          aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
        >
          {isPlaying ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </button>

        {/* Indicators */}
        <div className="carousel-indicators">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`carousel-indicator ${index === currentIndex ? 'active' : ''}`}
              aria-label={`Ir a imagen ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
