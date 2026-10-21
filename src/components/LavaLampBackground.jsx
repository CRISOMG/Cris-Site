import React from 'react';

/**
 * Componente de Lámpara de Lava (Lava Lamp)
 * Genera orbes orgánicos de cera líquida que suben, bajan, se estiran y se fusionan
 * con los colores de Blooker20 (Trinidad Orange #E65C00 y Candlelight Yellow #F9D423).
 *
 * @param {object} props
 * @param {boolean} [props.isMini=false] - Modo miniatura para el mockup del panel de administración
 * @param {boolean} [props.isDark=true] - Ajusta la intensidad de opacidad según el tema
 */
export default function LavaLampBackground({ isMini = false, isDark = true }) {
  const containerClass = isMini
    ? 'absolute inset-0 overflow-hidden pointer-events-none rounded-2xl'
    : 'absolute inset-0 overflow-hidden pointer-events-none';

  return (
    <div className={containerClass} aria-hidden='true'>
      {/* Definición SVG del filtro Gooey para fusión de gotas */}
      <svg className='absolute w-0 h-0 overflow-hidden' aria-hidden='true'>
        <defs>
          <filter id={isMini ? 'lava-goo-mini' : 'lava-goo'}>
            <feGaussianBlur in='SourceGraphic' stdDeviation={isMini ? '8' : '18'} result='blur' />
            <feColorMatrix
              in='blur'
              mode='matrix'
              values='1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -9'
              result='goo'
            />
            <feBlend in='SourceGraphic' in2='goo' />
          </filter>
        </defs>
      </svg>

      {/* Capa de luz ambiental de fondo */}
      <div
        className='absolute inset-0 opacity-40 mix-blend-screen pointer-events-none'
        style={{
          background: isDark
            ? 'radial-gradient(ellipse at 50% 25%, rgba(230,92,0,0.4) 0%, rgba(249,212,35,0.2) 40%, transparent 75%)'
            : 'radial-gradient(ellipse at 50% 30%, rgba(249,212,35,0.5) 0%, rgba(230,92,0,0.3) 50%, transparent 80%)',
        }}
      />

      {/* Contenedor Gooey con las gotas de lava que suben y bajan */}
      <div
        className='w-full h-full relative'
        style={{
          filter: `url(#${isMini ? 'lava-goo-mini' : 'lava-goo'})`,
        }}
      >
        {/* Gota 1: Gota principal grande (Trinidad Orange) - Sube por la izquierda */}
        <div
          className={`absolute rounded-full lava-blob lava-rise-1 ${
            isMini ? 'w-24 h-28 -bottom-6 left-[10%]' : 'w-72 sm:w-96 h-80 sm:h-[420px] -bottom-24 left-[15%]'
          }`}
          style={{
            background: 'linear-gradient(135deg, #E65C00, #FF7700)',
            opacity: isDark ? 0.75 : 0.65,
          }}
        />

        {/* Gota 2: Gota solar brillante (Candlelight Yellow) - Sube por la derecha */}
        <div
          className={`absolute rounded-full lava-blob lava-rise-2 ${
            isMini ? 'w-20 h-24 -bottom-4 right-[12%]' : 'w-64 sm:w-80 h-72 sm:h-96 -bottom-20 right-[18%]'
          }`}
          style={{
            background: 'linear-gradient(135deg, #F9D423, #FFAA5B)',
            opacity: isDark ? 0.85 : 0.7,
          }}
        />

        {/* Gota 3: Burbuja flotante central (Ámbar) - Oscila detrás del avatar */}
        <div
          className={`absolute rounded-full lava-blob lava-rise-3 ${
            isMini ? 'w-16 h-20 top-4 left-[40%]' : 'w-48 sm:w-64 h-56 sm:h-72 top-16 left-[38%]'
          }`}
          style={{
            background: 'linear-gradient(180deg, #FFAA5B, #E65C00)',
            opacity: isDark ? 0.7 : 0.6,
          }}
        />

        {/* Gota 4: Burbuja pequeña rápida (Fuego cálido) */}
        <div
          className={`absolute rounded-full lava-blob lava-bubble ${
            isMini ? 'w-10 h-14 bottom-2 left-[48%]' : 'w-32 sm:w-40 h-40 sm:h-52 bottom-6 left-[46%]'
          }`}
          style={{
            background: 'linear-gradient(135deg, #FF6F00, #F9D423)',
            opacity: isDark ? 0.8 : 0.65,
          }}
        />

        {/* Gota 5: Reservorio basal de magma en el fondo (respira lentamente) */}
        <div
          className={`absolute rounded-full lava-blob lava-base ${
            isMini ? 'w-[120%] h-14 -bottom-8 -left-[10%]' : 'w-[110%] h-36 sm:h-48 -bottom-20 -left-[5%]'
          }`}
          style={{
            background: 'linear-gradient(to top, #E65C00, rgba(249, 212, 35, 0.4))',
            opacity: isDark ? 0.75 : 0.55,
          }}
        />
      </div>

      <style jsx>{`
        /* Animación de morfología orgánica (la cera cambia de forma) */
        .lava-blob {
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          animation-direction: alternate;
          will-change: transform, border-radius;
        }

        /* Gota 1: Sube desde el fondo hasta la parte media-alta y se estira */
        .lava-rise-1 {
          animation: lavaRise1 14s ease-in-out infinite alternate,
            lavaMorph1 8s ease-in-out infinite alternate;
        }

        /* Gota 2: Sube desde abajo a la derecha hacia arriba */
        .lava-rise-2 {
          animation: lavaRise2 18s ease-in-out infinite alternate,
            lavaMorph2 11s ease-in-out infinite alternate;
        }

        /* Gota 3: Flota en la zona central con ondulación suave */
        .lava-rise-3 {
          animation: lavaRise3 12s ease-in-out infinite alternate,
            lavaMorph1 9s ease-in-out infinite alternate;
        }

        /* Gota 4: Burbuja vertical ascendente que se estira al subir */
        .lava-bubble {
          animation: lavaBubble 9s ease-in-out infinite alternate,
            lavaMorph2 7s ease-in-out infinite alternate;
        }

        /* Gota 5: Fondo base que late y sube sutilmente */
        .lava-base {
          animation: lavaBase 7s ease-in-out infinite alternate;
        }

        @keyframes lavaRise1 {
          0% {
            transform: translateY(0%) scale(1, 0.95);
          }
          40% {
            transform: translateY(-45%) scale(0.9, 1.25);
          }
          70% {
            transform: translateY(-85%) scale(1.1, 0.9);
          }
          100% {
            transform: translateY(-115%) translateX(25px) scale(0.95, 1.15);
          }
        }

        @keyframes lavaRise2 {
          0% {
            transform: translateY(0%) scale(0.95, 1.05);
          }
          35% {
            transform: translateY(-50%) translateX(-20px) scale(0.85, 1.2);
          }
          75% {
            transform: translateY(-95%) translateX(15px) scale(1.12, 0.92);
          }
          100% {
            transform: translateY(-125%) translateX(-10px) scale(1, 1.1);
          }
        }

        @keyframes lavaRise3 {
          0% {
            transform: translateY(0%) translateX(0%) scale(1);
          }
          50% {
            transform: translateY(35%) translateX(-15px) scale(1.1, 0.9);
          }
          100% {
            transform: translateY(-30%) translateX(20px) scale(0.9, 1.15);
          }
        }

        @keyframes lavaBubble {
          0% {
            transform: translateY(0%) scale(0.95, 1.05);
          }
          50% {
            transform: translateY(-70%) scale(0.85, 1.3);
          }
          100% {
            transform: translateY(-140%) scale(1.05, 0.95);
          }
        }

        @keyframes lavaBase {
          0% {
            transform: scaleY(0.9) translateY(5px);
          }
          100% {
            transform: scaleY(1.15) translateY(-10px);
          }
        }

        @keyframes lavaMorph1 {
          0% {
            border-radius: 45% 55% 60% 40% / 50% 45% 55% 50%;
          }
          50% {
            border-radius: 60% 40% 45% 55% / 40% 60% 40% 60%;
          }
          100% {
            border-radius: 40% 60% 50% 50% / 55% 40% 60% 45%;
          }
        }

        @keyframes lavaMorph2 {
          0% {
            border-radius: 50% 50% 45% 55% / 60% 40% 60% 40%;
          }
          50% {
            border-radius: 40% 60% 60% 40% / 45% 55% 45% 55%;
          }
          100% {
            border-radius: 60% 40% 50% 50% / 40% 60% 40% 60%;
          }
        }
      `}</style>
    </div>
  );
}
