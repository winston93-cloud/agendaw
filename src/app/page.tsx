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
              <p className="hero-blink-text">Más de 30 años formando líderes</p>
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
          <p className="section-subtitle">Solo 3 sencillos pasos</p>

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
            {/* Step 1 */}
            <div className="step-card">
              <div className="step-number">1</div>
              <div className="step-icon">📄</div>
              <h3 className="step-title">Reúne tu documentación</h3>
              <ul className="step-list">
                <li>Constancia del nivel actual (Maternal/Kinder 1)</li>
                <li>Última boleta interna del año en curso</li>
                <li>Boleta oficial del ciclo anterior</li>
                <li>Carta de Buena Conducta</li>
              </ul>
            </div>

            {/* Step 2 */}
            <div className="step-card">
              <div className="step-number">2</div>
              <div className="step-icon">📧</div>
              <h3 className="step-title">Envía tu documentación</h3>
              <p className="step-description">
                Envía los documentos por email según el nivel:
              </p>
              <div className="email-list">
                <div className="email-item">
                  <strong>Maternal/Kinder:</strong>
                  <span>psicologia.kinder@winston93.edu.mx</span>
                </div>
                <div className="email-item">
                  <strong>Primaria:</strong>
                  <span>psicologia.primaria@winston93.edu.mx</span>
                </div>
                <div className="email-item">
                  <strong>Secundaria:</strong>
                  <span>psicologia.secundaria@winston93.edu.mx</span>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div id="agendar-ahora" className="step-card step-highlight">
              <div className="step-number">3</div>
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
