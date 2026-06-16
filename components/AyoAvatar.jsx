import Image from 'next/image'

export default function AyoAvatar({ size = 48, glow = false }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        minWidth: size,
        borderRadius: '50%',
        overflow: 'hidden',
        boxShadow: glow
          ? '0 0 0 3px var(--primary-subtle), 0 0 32px 8px rgba(124,111,255,0.25)'
          : undefined,
        animation: glow ? 'ayoGlow 3s ease-in-out infinite' : undefined,
        flexShrink: 0,
      }}
    >
      <Image
        src="/ai bot face.png"
        alt="Ayo"
        width={size}
        height={size}
        style={{ objectFit: 'cover', width: '100%', height: '100%' }}
        priority
      />
      {glow && (
        <style>{`
          @keyframes ayoGlow {
            0%, 100% { box-shadow: 0 0 0 3px var(--primary-subtle), 0 0 24px 6px rgba(124,111,255,0.2); }
            50%       { box-shadow: 0 0 0 3px var(--primary-subtle), 0 0 44px 14px rgba(79,209,197,0.3); }
          }
          @media (prefers-reduced-motion: reduce) {
            [style*="ayoGlow"] { animation: none !important; }
          }
        `}</style>
      )}
    </div>
  )
}
