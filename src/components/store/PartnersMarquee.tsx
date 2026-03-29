'use client';

import { useState, useEffect } from 'react';

interface Partner {
  id: string;
  name: string;
  nameAr?: string;
  logo: string;
  url?: string;
  order: number;
  active: boolean;
}

export function PartnersMarquee() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const res = await fetch('/api/partners');
      const data = await res.json();
      if (data.success && data.data?.length > 0) {
        setPartners(data.data);
      } else {
        setPartners([
          { id: '1', name: 'Clio', logo: '/partners/clio.png', order: 0, active: true },
          { id: '2', name: 'Faber-Castell', logo: '/partners/faber-castell.png', order: 1, active: true },
          { id: '3', name: 'Casio', logo: '/partners/casio.png', order: 2, active: true },
          { id: '4', name: 'Rotring', logo: '/partners/rotring.png', order: 3, active: true },
          { id: '5', name: 'MG', logo: '/partners/mg.png', order: 4, active: true },
          { id: '6', name: 'Uni-ball', logo: '/partners/uniball.png', order: 5, active: true },
        ]);
      }
    } catch (error) {
      console.error('Error fetching partners:', error);
      setPartners([
        { id: '1', name: 'Clio', logo: '/partners/clio.png', order: 0, active: true },
        { id: '2', name: 'Faber-Castell', logo: '/partners/faber-castell.png', order: 1, active: true },
        { id: '3', name: 'Casio', logo: '/partners/casio.png', order: 2, active: true },
        { id: '4', name: 'Rotring', logo: '/partners/rotring.png', order: 3, active: true },
        { id: '5', name: 'MG', logo: '/partners/mg.png', order: 4, active: true },
        { id: '6', name: 'Uni-ball', logo: '/partners/uniball.png', order: 5, active: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading || partners.length === 0) return null;

  const displayItems = [...partners, ...partners, ...partners, ...partners];

  return (
    <section className="py-8 bg-gray-50 dark:bg-gray-900 overflow-hidden" dir="rtl">
      <div className="text-center mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
          شركاؤنا في النجاح
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">أفضل الماركات العالمية والمحلية</p>
      </div>

      <div className="relative">
        {/* Gradient Overlays */}
        <div className="absolute right-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-l from-gray-50 dark:from-gray-900 to-transparent z-10 pointer-events-none" />
        <div className="absolute left-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-r from-gray-50 dark:from-gray-900 to-transparent z-10 pointer-events-none" />

        {/* Marquee Container */}
        <div className="overflow-hidden">
          <div className="flex gap-8 md:gap-12 items-center marquee-track">
            {displayItems.map((partner, index) => (
              <div
                key={`${partner.id}-${index}`}
                className="flex-shrink-0 w-28 h-20 md:w-40 md:h-24 bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 hover:shadow-lg dark:hover:shadow-gray-900/80 transition-all duration-300 flex items-center justify-center p-3 border border-gray-100 dark:border-gray-700"
              >
                {partner.url ? (
                  <a href={partner.url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={partner.logo}
                      alt={partner.name}
                      className="max-w-full max-h-full object-contain filter grayscale hover:grayscale-0 dark:grayscale-0 transition-all duration-300"
                    />
                  </a>
                ) : (
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className="max-w-full max-h-full object-contain filter grayscale hover:grayscale-0 dark:grayscale-0 transition-all duration-300"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .marquee-track {
          animation: marquee-scroll 25s linear infinite;
          width: max-content;
        }

        @keyframes marquee-scroll {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-25%);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .marquee-track {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}
