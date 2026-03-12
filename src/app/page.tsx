import Link from 'next/link'
import Image from 'next/image'
import { getTranslations, getLocale } from 'next-intl/server'
import Carousel from '@/components/Carousel'
import ScrollButton from '@/components/ScrollButton'
import LangSelector from '@/components/LangSelector'
import PublicThemeToggle from '@/components/PublicThemeToggle'

export default async function Home() {
  const t = await getTranslations('home')
  const locale = await getLocale()

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
              <div className="hero-lang-bar">
                <PublicThemeToggle />
                <LangSelector currentLocale={locale as 'es' | 'en'} />
              </div>
              <p className="hero-subtitle hero-intro">
                {t('intro')}
              </p>
              <p className="hero-blink-text">
                <span className="hero-blink-emoji" aria-hidden>🎓</span>
                <span className="hero-blink-label">{t('tagline')}</span>
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
                <span className="cta-text">{t('ctaButton')}</span>
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
          <h2 className="section-title">{t('howTitle')}</h2>
          <p className="section-subtitle">{t('howSubtitle')}</p>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
            {/* Step 1: Solo agenda tu cita */}
            <div id="agendar-ahora" className="step-card step-highlight" style={{ maxWidth: '400px' }}>
              <div className="step-number">1</div>
              <div className="step-icon">📅</div>
              <h3 className="step-title">{t('step1Title')}</h3>
              <p className="step-description">
                {t('step1Desc')}
              </p>
              <Link href="/agendar" className="step-cta">
                {t('step1Cta')}
              </Link>
            </div>
          </div>

          {/* Banner aviso: pago el día de la cita — abajo de la tarjeta */}
          <div className="process-banner" style={{ marginTop: '2rem', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
            <span className="process-banner-icon">💳</span>
            <div className="process-banner-content">
              <p className="process-banner-text">
                {t('bannerText')}
              </p>
              <p className="process-banner-price">
                <span className="process-banner-label">{t('bannerLabel')}</span>
                <strong className="process-banner-amount">{t('bannerAmount')}</strong>
              </p>
            </div>
          </div>

          {/* Copyright */}
          <div style={{ 
            textAlign: 'center', 
            marginTop: '3rem', 
            paddingTop: '2rem', 
            borderTop: '1px solid rgba(0,0,0,0.1)',
            color: '#64748b',
            fontSize: '0.875rem'
          }}>
            <p style={{ margin: 0 }}>{t('copyright')}</p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', opacity: 0.8 }}>{t('version')}</p>
          </div>
        </div>
      </div>
    </main>
  )
}
