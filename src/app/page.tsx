import Link from 'next/link'
import Image from 'next/image'
import Carousel from '@/components/Carousel'

export default function Home() {
  return (
    <main className="admission-page">
      {/* Hero Section */}
      <div className="admission-hero">
        <div className="hero-content">
          <div className="hero-logos">
            {/* Logo izquierdo */}
            <div className="hero-logo-wrapper">
              <Image 
                src="/logo-winston-educativo.png" 
                alt="Instituto Educativo Winston"
                width={120}
                height={120}
                className="hero-logo"
              />
            </div>

            {/* Contenido central */}
            <div className="hero-center-content">
              <h1 className="hero-title">
                INICIA HOY TU<br />
                <span className="highlight">PROCESO DE ADMISIÓN</span>
              </h1>
              <p className="hero-subtitle">
                Agenda tu cita de manera fácil y rápida
              </p>
              
              {/* Carousel */}
              <Carousel />
            </div>

            {/* Logo derecho */}
            <div className="hero-logo-wrapper">
              <Image 
                src="/logo-winston-churchill.png" 
                alt="Instituto Winston Churchill"
                width={120}
                height={120}
                className="hero-logo"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Process Steps */}
      <div className="container">
        <div className="process-section">
          <h2 className="section-title">¿Cómo funciona?</h2>
          <p className="section-subtitle">Solo 4 sencillos pasos</p>

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
            <div className="step-card step-highlight">
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

            {/* Step 4 */}
            <div className="step-card">
              <div className="step-number">4</div>
              <div className="step-icon">💳</div>
              <h3 className="step-title">Realiza el pago</h3>
              <p className="step-description">
                El día de tu cita, realiza el pago del examen en recepción
              </p>
              <div className="price-tag">
                <span className="price-label">Costo del examen:</span>
                <span className="price-amount">$200 MXN</span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="cta-section">
          <div className="cta-card">
            <h2>¿Listo para comenzar?</h2>
            <p>Selecciona el campus y agenda tu cita en menos de 3 minutos</p>
            <div className="campus-mini-cards">
              <div className="campus-mini">
                <Image 
                  src="/logo-winston-educativo.png" 
                  alt="Instituto Educativo Winston"
                  width={60}
                  height={60}
                  className="mini-logo"
                />
                <p>Instituto Educativo Winston</p>
                <small>Maternal y Kinder</small>
              </div>
              <div className="campus-mini">
                <Image 
                  src="/logo-winston-churchill.png" 
                  alt="Instituto Winston Churchill"
                  width={60}
                  height={60}
                  className="mini-logo"
                />
                <p>Instituto Winston Churchill</p>
                <small>Primaria y Secundaria</small>
              </div>
            </div>
            <Link href="/agendar" className="btn btn-primary btn-large">
              Agendar mi cita →
            </Link>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="faq-section">
          <h2 className="section-title">Preguntas Frecuentes</h2>
          <div className="faq-grid">
            <div className="faq-item">
              <h4>¿Cuánto dura la entrevista?</h4>
              <p>La entrevista tiene una duración aproximada de 30 minutos.</p>
            </div>
            <div className="faq-item">
              <h4>¿Puedo reagendar mi cita?</h4>
              <p>Sí, puedes modificar tu cita con al menos 24 horas de anticipación.</p>
            </div>
            <div className="faq-item">
              <h4>¿Qué debo llevar el día de la cita?</h4>
              <p>Lleva tu identificación oficial y el comprobante de cita que recibirás por email.</p>
            </div>
            <div className="faq-item">
              <h4>¿Puedo llevar a mi hijo/a?</h4>
              <p>Sí, es recomendable que el aspirante asista a la entrevista.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
