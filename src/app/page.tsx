import Link from 'next/link'
import Image from 'next/image'
import Carousel from '@/components/Carousel'
import ScrollButton from '@/components/ScrollButton'

export default function Home() {
  return (
    <main className="admission-page">
      {/* Hero Section */}
      <div className="admission-hero">
        <div className="hero-content">
          <div className="hero-logos">
            {/* Logo izquierdo + texto */}
            <div className="hero-logo-wrapper">
              <Image 
                src="/logo-winston-educativo.png" 
                alt="Instituto Educativo Winston"
                width={120}
                height={120}
                className="hero-logo"
              />
              <p className="hero-logo-caption hero-slogan">Raising Brighter Kids</p>
            </div>

            {/* Contenido central */}
            <div className="hero-center-content">
              <p className="hero-subtitle hero-intro">
                Agenda tu entrevista de admisión en línea — seguro, sencillo y en pocos minutos.
              </p>
              <p className="hero-blink-text">
                <span className="hero-blink-emoji" aria-hidden>🎓</span>
                <span className="hero-blink-label">Más de 30 años formando líderes</span>
                <span className="hero-blink-emoji" aria-hidden>✨</span>
              </p>
              <Carousel />
              <ScrollButton
                targetSelector="#agendar-ahora"
                scrollBlock="center"
                mobileTargetSelector=".process-section"
                mobileScrollBlock="start"
                className="hero-cta-button hero-title-cta"
              >
                <span className="cta-text">Agenda tu cita de admisión</span>
                <span className="cta-arrow">↓</span>
              </ScrollButton>
            </div>

            {/* Logo derecho + texto */}
            <div className="hero-logo-wrapper">
              <Image 
                src="/logo-winston-churchill.png" 
                alt="Instituto Winston Churchill"
                width={120}
                height={120}
                className="hero-logo"
              />
              <p className="hero-logo-caption hero-slogan">Working for brighter futures</p>
            </div>
          </div>
        </div>
      </div>

      {/* Process Steps */}
      <div className="container container-process">
        <div className="process-section">
          <h2 className="section-title">¿Cómo funciona?</h2>
          <p className="section-subtitle">Es muy sencillo</p>

          {/* Banner aviso: pago el día de la cita — arriba de los pasos */}
          <div className="process-banner">
            <span className="process-banner-icon">💳</span>
            <div className="process-banner-content">
              <p className="process-banner-text">
                El día de tu cita realiza el pago del examen en recepción.
              </p>
              <p className="process-banner-price">
                <span className="process-banner-label">Costo del examen:</span>
                <strong className="process-banner-amount">$200 MXN</strong>
              </p>
            </div>
          </div>

          <div className="steps-grid">
            {/* Step 1: Solo agenda tu cita */}
            <div id="agendar-ahora" className="step-card step-highlight">
              <div className="step-number">1</div>
              <div className="step-icon">📅</div>
              <h3 className="step-title">Agenda tu cita</h3>
              <p className="step-description">
                Llena el formulario y elige la fecha y hora que mejor te convenga
              </p>
              <Link href="/agendar" className="step-cta">
                Agendar ahora →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
