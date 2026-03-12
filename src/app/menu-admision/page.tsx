'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'

function MenuContent() {
  const t = useTranslations('menu')
  const searchParams = useSearchParams()
  const citaId = searchParams.get('cita')

  if (!citaId) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#ef4444' }}>{t('invalidLink')}</p>
        <Link href="/" style={{ color: '#60a5fa', textDecoration: 'underline', marginTop: '1rem', display: 'inline-block' }}>
          {t('backHome')}
        </Link>
      </div>
    )
  }

  return (
    <div className="expediente-page">
      <header className="expediente-hero">
        <h1 className="expediente-hero-title">
          <span className="expediente-hero-title-line">{t('welcomeTitle')}</span>
          <span className="expediente-hero-title-line" style={{ fontSize: '1.2rem', opacity: 0.9 }}>
            {t('welcomeSubtitle')}
          </span>
        </h1>
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.15)', 
          backdropFilter: 'blur(8px)',
          padding: '1.25rem 1.5rem', 
          borderRadius: '12px',
          maxWidth: '700px',
          margin: '1.5rem auto 0',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          textAlign: 'center'
        }}>
          <p style={{ 
            fontSize: '1.05rem', 
            opacity: 1, 
            margin: 0, 
            fontWeight: '500',
            color: '#fff',
            textShadow: '0 1px 2px rgba(0,0,0,0.1)',
            lineHeight: '1.6'
          }}>
            ⚠️ <strong>Importante:</strong> {t('importantText')} <span style={{ color: '#fbbf24', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('importantHighlight')}</span> {t('importantSuffix')}
          </p>
        </div>
      </header>

      <div className="expediente-form-container" style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '2rem',
          marginTop: '2rem'
        }}>
          
          {/* Tarjeta 1: Expediente Inicial */}
          <Link 
            href={`/expediente_inicial?cita=${citaId}`}
            className="menu-card"
            style={{ textDecoration: 'none', position: 'relative' }}
          >
            <div style={{ 
              position: 'absolute', 
              top: '-12px', 
              left: '50%', 
              transform: 'translateX(-50%)', 
              background: '#6366f1', 
              color: 'white', 
              padding: '4px 12px', 
              borderRadius: '20px', 
              fontSize: '0.85rem', 
              fontWeight: '700',
              boxShadow: '0 4px 6px rgba(99, 102, 241, 0.3)',
              zIndex: 10
            }}>
              {t('step1Badge')}
            </div>
            <div className="menu-card-inner">
              <div className="menu-card-icon">📋</div>
              <h3 className="menu-card-title">{t('card1Title')}</h3>
              <p className="menu-card-description">
                {t('card1Desc')}
              </p>
              <span className="menu-card-cta">{t('card1Cta')}</span>
            </div>
          </Link>

          {/* Tarjeta 2: Subir Documentación */}
          <Link 
            href={`/documentacion?cita=${citaId}`}
            className="menu-card"
            style={{ textDecoration: 'none', position: 'relative' }}
          >
            <div style={{ 
              position: 'absolute', 
              top: '-12px', 
              left: '50%', 
              transform: 'translateX(-50%)', 
              background: '#059669', 
              color: 'white', 
              padding: '4px 12px', 
              borderRadius: '20px', 
              fontSize: '0.85rem', 
              fontWeight: '700',
              boxShadow: '0 4px 6px rgba(5, 150, 105, 0.3)',
              zIndex: 10
            }}>
              {t('step2Badge')}
            </div>
            <div className="menu-card-inner">
              <div className="menu-card-icon">📤</div>
              <h3 className="menu-card-title">{t('card2Title')}</h3>
              <p className="menu-card-description">
                {t('card2Desc')}
              </p>
              <span className="menu-card-cta">{t('card2Cta')}</span>
            </div>
          </Link>
          
        </div>
      </div>
    </div>
  )
}

function MenuFallback() {
  const t = useTranslations('menu')
  return (
    <div className="expediente-page">
      <p style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.9)' }}>{t('loading')}</p>
    </div>
  )
}

export default function MenuPage() {
  return (
    <Suspense fallback={<MenuFallback />}>
      <MenuContent />
    </Suspense>
  )
}
