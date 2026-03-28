'use client';

import { Category } from '@prisma/client';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';

interface CategorySectionProps {
  categories: Category[];
}

const categoryConfig: Record<string, { icon: string; color: string; gradient: string }> = {
  'pens-pencils': { 
    icon: '🖊️', 
    color: 'from-blue-500 to-indigo-500',
    gradient: 'hover:from-blue-50 hover:to-indigo-50'
  },
  'notebooks': { 
    icon: '📓', 
    color: 'from-amber-500 to-orange-500',
    gradient: 'hover:from-amber-50 hover:to-orange-50'
  },
  'school-bags': { 
    icon: '🎒', 
    color: 'from-purple-500 to-pink-500',
    gradient: 'hover:from-purple-50 hover:to-pink-50'
  },
  'art-supplies': { 
    icon: '🎨', 
    color: 'from-rose-500 to-red-500',
    gradient: 'hover:from-rose-50 hover:to-red-50'
  },
  'office-tools': { 
    icon: '📎', 
    color: 'from-teal-500 to-cyan-500',
    gradient: 'hover:from-teal-50 hover:to-cyan-50'
  },
  'educational': { 
    icon: '🌍', 
    color: 'from-green-500 to-emerald-500',
    gradient: 'hover:from-green-50 hover:to-emerald-50'
  },
};

export function CategorySection({ categories }: CategorySectionProps) {
  const { setSelectedCategory } = useStore();

  return (
    <section id="categories-section" className="py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            تصفح حسب الفئة
          </h2>
          <p className="text-gray-500 mt-1">اختر الفئة التي تبحث عنها</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        {categories.map((category, index) => {
          const config = categoryConfig[category.slug] || { 
            icon: '📦', 
            color: 'from-gray-500 to-gray-600',
            gradient: 'hover:from-gray-50 hover:to-gray-100'
          };

          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="group cursor-pointer"
              onClick={() => {
                setSelectedCategory(category.id);
                document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <div className={`relative overflow-hidden rounded-2xl p-6 text-center transition-all duration-300 border-2 border-transparent hover:border-teal-200 ${config.gradient}`}>
                {/* Icon Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${config.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                
                <motion.div
                  whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.4 }}
                  className="relative text-5xl mb-4"
                >
                  {config.icon}
                </motion.div>

                <h3 className="font-bold text-gray-900 group-hover:text-teal-600 transition-colors">
                  {category.nameAr}
                </h3>
                
                <motion.div
                  initial={{ width: 0 }}
                  whileHover={{ width: '100%' }}
                  className={`absolute bottom-0 left-0 h-1 bg-gradient-to-l ${config.color} rounded-t-full`}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
