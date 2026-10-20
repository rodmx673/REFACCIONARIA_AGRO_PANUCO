import { BlogPost, Review, Coupon } from '../../types';

export const SAMPLE_BLOG_POSTS: BlogPost[] = [
  {
    id: 'post-1',
    slug: 'como-diagnosticar-bomba-hidraulica-john-deere',
    title: 'Diagnóstico y Mantenimiento de Bombas Hidráulicas John Deere Serie 6000 y 7000',
    excerpt: 'Aprende a identificar ruidos de cavitación, pérdida de presión en brazos de levante y fugas prematuras en el circuito hidráulico agrícola.',
    category: 'Mantenimiento Hidráulico',
    author: 'Ing. Carlos Mendoza (Especialista en Maquinaria)',
    coverImage: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&q=80&w=800',
    readTime: '6 min',
    tags: ['John Deere', 'Hidráulico', 'Bomba', 'Diagnóstico'],
    createdAt: '2026-09-15T10:00:00Z',
    content: `
El sistema hidráulico de los tractores John Deere (series 6403, 6603, 7515) trabaja bajo altas presiones de trabajo continuo en campo. Cuando se presenta lentitud en la dirección o en la toma de fuerza remota, el primer punto de inspección debe ser la válvula de alivio y el filtro de succión.

### Señales de Alerta Comunes:
1. **Gemido o silbido agudo al accionar los mandos:** Usualmente indica aire en el circuito o restricción en el filtro de aspiración.
2. **Temperatura excesiva en las líneas metálicas:** Puede deberse a aceite degradado fuera de viscosidad ISO VG 46/68 o cavitación.
3. **Pérdida de fuerza cuando el motor calienta:** Señal inequívoca de desgaste en los engranes o platos de presión de la bomba.

### Recomendaciones de Taller:
- Reemplazar siempre los sellos tóricos (O-rings) de vitón al desmontar la bomba.
- Limpiar el cárter de transmisión antes de instalar una bomba nueva para evitar que rebabas metálicas rayen los sellos nuevos.
    `
  },
  {
    id: 'post-2',
    slug: 'guia-ajuste-embrague-massey-ferguson-285',
    title: 'Guía Completa para el Cambio y Calibración de Clutch en Massey Ferguson 285 y 290',
    excerpt: 'Paso a paso para desmontar, centrar el disco de 12 pulgadas y calibrar las palancas de desembrague para evitar patinamiento bajo carga pesada.',
    category: 'Transmisión y Embrague',
    author: 'Téc. Rodrigo Morales (Jefe de Taller)',
    coverImage: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&q=80&w=800',
    readTime: '8 min',
    tags: ['Massey Ferguson', 'Clutch', 'Transmisión', 'Calibración'],
    createdAt: '2026-09-20T14:30:00Z',
    content: `
El tractor Massey Ferguson 285 es el caballo de batalla en el campo mexicano. El ensamble de clutch de doble disco (tracción y toma de fuerza) requiere un ajuste micrométrico de las tres palancas liberadoras.

### Tolerancias Críticas de Ajuste:
- La altura de las palancas con respecto a la pista de apoyo debe mantenerse uniforme a 41.5 mm (+/- 0.5 mm).
- Utilizar siempre la herramienta de alineación estriada para que la flecha de mando entre sin forzar los baleros guía.
- Sustituir de manera preventiva el collarín de empuje y el balero piloto del volante del motor.
    `
  },
  {
    id: 'post-3',
    slug: 'filtros-originales-vs-alternativos-como-elegir',
    title: 'Filtros Originales vs Alternativos: ¿Cómo Proteger el Motor Perkins y Cummins?',
    excerpt: 'Comparamos la eficiencia de micraje, capacidad de retención de carboncillos y válvulas antidrenaje en filtros de aceite y diésel.',
    category: 'Motores Diésel',
    author: 'Ing. Alberto Ruiz (Farmer Parts)',
    coverImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=800',
    readTime: '5 min',
    tags: ['Filtros', 'Perkins', 'Cummins', 'Aceite'],
    createdAt: '2026-09-28T09:15:00Z',
    content: `
En labores de barbecho y rastreo, el polvo suspendido es el enemigo silencioso de los anillos del pistón y camisas húmedas. Un filtro de combustible de baja calidad puede dejar pasar micropartículas de agua y herrumbre que dañan la bomba de inyección rotativa en menos de 200 horas de uso.

Verifica siempre que el filtro cuente con válvula bypass calibrada a la presión estipulada por el fabricante del motor y papel celulósico con tratamiento de resina fenólica.
    `
  }
];

export const SAMPLE_REVIEWS: Record<string, Review[]> = {
  '1660114M91': [
    {
      productId: '1660114M91',
      customerName: 'Don Aurelio Garza (Rancho La Palma)',
      customerEmail: 'aurelio.garza@hotmail.com',
      rating: 5,
      comment: 'Excelente bomba de agua. La instalamos en un MF 285 modelo 1998 y la temperatura no pasa del verde ni rastreando en pleno mediodía. Llegó al día siguiente.',
      status: 'APPROVED',
      helpfulVotes: 14,
      verifiedPurchase: true,
      createdAt: '2026-09-18T16:20:00Z'
    },
    {
      productId: '1660114M91',
      customerName: 'Taller Agrícola San Isidro',
      customerEmail: 'taller.sanisidro@gmail.com',
      rating: 5,
      comment: 'Trae su junta incluida de buen grosor. La polea y el impulsor de fundición se sienten macizos y bien balanceados.',
      status: 'APPROVED',
      helpfulVotes: 8,
      verifiedPurchase: true,
      createdAt: '2026-09-25T11:45:00Z'
    }
  ],
  'RE504836': [
    {
      productId: 'RE504836',
      customerName: 'Ing. Javier Pacheco',
      customerEmail: 'jpacheco.agro@gmail.com',
      rating: 5,
      comment: 'Filtro original John Deere con su sello de fábrica. Compré 5 piezas para tener en stock para los mantenimientos de la temporada.',
      status: 'APPROVED',
      helpfulVotes: 6,
      verifiedPurchase: true,
      createdAt: '2026-09-22T08:10:00Z'
    }
  ],
  'AL156331': [
    {
      productId: 'AL156331',
      customerName: 'Mario Alberto Trejo',
      customerEmail: 'mario.trejo67@yahoo.com',
      rating: 5,
      comment: 'Alternador de 90A de primera. Carga impecable incluso con los faros LED de trabajo nocturno encendidos.',
      status: 'APPROVED',
      helpfulVotes: 11,
      verifiedPurchase: true,
      createdAt: '2026-09-12T19:00:00Z'
    }
  ],
  '1868282M1': [
    {
      productId: '1868282M1',
      customerName: 'Refaccionaria del Norte',
      customerEmail: 'ventas@refnor.mx',
      rating: 5,
      comment: 'Kit de embrague muy completo. Entró suave en las estrías y el pedal quedó muy suave al desacople.',
      status: 'APPROVED',
      helpfulVotes: 9,
      verifiedPurchase: true,
      createdAt: '2026-09-10T14:15:00Z'
    }
  ]
};
