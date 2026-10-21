/**
 * Catálogo de Gradientes para el Fondo del Hero
 * Incluye la opción original y variaciones modernas como Blooker20 (Trinidad Orange + Candlelight Yellow)
 */
export const GRADIENT_THEMES = [
  {
    id: 'default',
    name: 'Original Cálido (Vertical)',
    badge: 'Actual',
    category: 'Linear Clásico',
    description: 'El degradado lineal vertical original del sitio, de amarillo a naranja.',
    colors: ['#FACC15', '#F97316'],
    cssValue: 'linear-gradient(to bottom, #facc15, #f97316)',
    wrapperClass: 'bg-gradient-to-b from-yellow-400 to-orange-500 text-black',
    previewGradient: 'linear-gradient(to bottom, #facc15, #f97316)',
  },
  {
    id: 'blooker20',
    name: 'Blooker20 Sunset (Diagonal 135°)',
    badge: 'Inspiración UI Gradients',
    category: 'Linear Moderno',
    description: 'El célebre Blooker20: combinación de Trinidad Orange (#E65C00) y Candlelight Yellow (#F9D423) con dirección diagonal suave.',
    colors: ['#E65C00', '#F9D423'],
    cssValue: 'linear-gradient(135deg, #e65c00 0%, #f9d423 100%)',
    style: {
      background: 'linear-gradient(135deg, #e65c00 0%, #f9d423 100%)',
    },
    wrapperClass: 'text-black',
    previewGradient: 'linear-gradient(135deg, #e65c00 0%, #f9d423 100%)',
  },
  {
    id: 'blooker20-radial',
    name: 'Blooker20 Solar Spotlight (Radial)',
    badge: 'Radial Spotlight',
    category: 'Radial Focal',
    description: 'Efecto halo solar con centro brillante de Candlelight Yellow en el avatar que se difumina hacia Trinidad Orange en los bordes.',
    colors: ['#F9D423', '#E65C00', '#B84500'],
    cssValue: 'radial-gradient(ellipse at top center, #f9d423 0%, #e65c00 70%, #b84500 100%)',
    style: {
      background: 'radial-gradient(ellipse at top center, #f9d423 0%, #e65c00 70%, #b84500 100%)',
    },
    wrapperClass: 'text-black',
    previewGradient: 'radial-gradient(circle, #f9d423 0%, #e65c00 100%)',
  },
  {
    id: 'blooker20-mesh',
    name: 'Blooker20 Aurora Mesh (Orbes 3D)',
    badge: 'Mesh Orgánico',
    category: 'Glassmorphism',
    description: 'Fondo base cálido con esferas orgánicas flotantes desenfocadas (blur-3xl) que crean profundidad tridimensional estilo Apple / Stripe.',
    colors: ['#E65C00', '#F9D423', '#FFAA5B'],
    hasMeshOrbs: true,
    cssValue: 'linear-gradient(180deg, #F9D423 0%, #E65C00 100%)',
    style: {
      background: 'linear-gradient(180deg, #f9d423 0%, #e65c00 100%)',
    },
    wrapperClass: 'text-black relative',
    previewGradient: 'radial-gradient(circle at 30% 30%, #f9d423, transparent 60%), radial-gradient(circle at 70% 70%, #e65c00, #ffaa5b)',
  },
  {
    id: 'blooker20-animated',
    name: 'Blooker20 Dinámico (Ondulante)',
    badge: 'Animado 60fps',
    category: 'Fluido CSS',
    description: 'Gradiente animado de cuatro tonos que se desplaza suavemente en un bucle continuo de 12 segundos, creando una sensación viva.',
    colors: ['#E65C00', '#F9D423', '#FFAA5B', '#EA580C'],
    isAnimated: true,
    cssValue: 'linear-gradient(-45deg, #e65c00, #f9d423, #ffaa5b, #ea580c)',
    style: {
      background: 'linear-gradient(-45deg, #e65c00, #f9d423, #ffaa5b, #ea580c)',
      backgroundSize: '400% 400%',
      animation: 'gradientFlow 12s ease infinite',
    },
    wrapperClass: 'text-black',
    previewGradient: 'linear-gradient(45deg, #e65c00, #f9d423, #ffaa5b)',
  },
  {
    id: 'dark-blooker-amber',
    name: 'Nocturno Obsidian & Lava Blooker20',
    badge: 'Lámpara de Lava',
    category: 'Oscuro Orgánico',
    description: 'Fondo obsidian profundo con efecto de lámpara de lava: orbes fluidos de Trinidad Orange y Candlelight Yellow que suben, bajan y se fusionan orgánicamente.',
    colors: ['#07151C', '#E65C00', '#F9D423', '#FFAA5B'],
    isDark: true,
    hasLavaLamp: true,
    cssValue: 'radial-gradient(ellipse at 50% 25%, #152732 0%, #0d1e27 40%, #07151C 75%, #030a0e 100%)',
    style: {
      background: 'radial-gradient(ellipse at 50% 25%, #152732 0%, #0d1e27 40%, #07151C 75%, #030a0e 100%)',
    },
    wrapperClass: 'text-[#F7EFC5] relative',
    previewGradient: 'radial-gradient(ellipse at 50% 25%, #152732 0%, #0d1e27 40%, #07151C 75%, #030a0e 100%)',
  },
];

/**
 * Obtiene el tema seleccionado o retorna el clásico por defecto
 */
export function getGradientTheme(themeId) {
  return GRADIENT_THEMES.find((t) => t.id === themeId) || GRADIENT_THEMES[0];
}
