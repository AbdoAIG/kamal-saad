'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

const partners = [
  { name: 'Clio', logo: '/partners/clio.png' },
  { name: 'Faber-Castell', logo: '/partners/faber-castell.png' },
  { name: 'Casio', logo: '/partners/casio.png' },
  { name: 'Rotring', logo: '/partners/rotring.png' },
  { name: 'MG', logo: '/partners/mg.png' },
  { name: 'Uni-ball', logo: '/partners/uniball.png' },
];

export function PartnersMarquee() {
  return (
    <section className="py-8 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 overflow-hidden" dir="rtl">
      <div className="text-center mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
          شركاؤنا في النجاح
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">أفضل الماركات العالمية والمحلية</p>
      </div>

      <div className="relative">
        {/* Gradient Overlays */}
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-gray-50 dark:from-gray-900 to-transparent z-10 pointer-events-none" />
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white dark:from-gray-900 to-transparent z-10 pointer-events-none" />

        {/* Marquee Container */}
        <div className="flex overflow-hidden">
          <motion.div
            className="flex gap-12 items-center"
            animate={{
              x: [0, -1500]
            }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: 20,
                ease: "linear",
              },
            }}
          >
            {/* First set of logos */}
            {partners.map((partner, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-32 h-20 md:w-40 md:h-24 bg-white dark:bg-gray-700 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex items-center justify-center p-3 border border-gray-100 dark:border-gray-600"
              >
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className="max-w-full max-h-full object-contain filter grayscale hover:grayscale-0 dark:grayscale-0 transition-all duration-300"
                />
              </div>
            ))}
            {/* Duplicate set for seamless loop */}
            {partners.map((partner, index) => (
              <div
                key={`dup-${index}`}
                className="flex-shrink-0 w-32 h-20 md:w-40 md:h-24 bg-white dark:bg-gray-700 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex items-center justify-center p-3 border border-gray-100 dark:border-gray-600"
              >
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className="max-w-full max-h-full object-contain filter grayscale hover:grayscale-0 dark:grayscale-0 transition-all duration-300"
                />
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
