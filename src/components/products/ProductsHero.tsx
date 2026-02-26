import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Plus, Package, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/LanguageProvider';
import ProductStatsSummary from '@/components/ProductStatsSummary';

interface ProductsHeroProps {
    onNewProduct: () => void;
    onAutoGenerate: () => void;
    onImport: () => void;
    onSaveAll?: () => void;
    hasEditedProducts?: boolean;
    isSavingAll?: boolean;
    products: any[];
}

const ProductsHero = ({
    onNewProduct,
    onAutoGenerate,
    onImport,
    onSaveAll,
    hasEditedProducts,
    isSavingAll,
    products
}: ProductsHeroProps) => {
    const { t } = useLanguage();

    return (
        <div className="w-full px-4 lg:px-6 pt-6 relative z-10">
            <div className="w-full bg-gradient-to-br from-indigo-700 via-indigo-600 to-teal-600 text-white rounded-[32px] py-10 px-8 md:px-12 shadow-xl relative overflow-hidden mb-8">
                {/* Decorative circles */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl opacity-50" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-400/20 rounded-full -ml-40 -mb-40 blur-3xl" />

                <div className="w-full relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="flex flex-col xl:flex-row xl:items-center justify-between gap-8"
                    >
                        <div className="flex flex-col md:flex-row md:items-center gap-8">
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                                    <Sparkles className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-none text-white uppercase mb-2">
                                        {t('productsOverview')}
                                    </h1>
                                    <p className="text-white/70 font-medium tracking-wide text-sm uppercase">
                                        {t('manageInventory')}
                                    </p>
                                </div>
                            </div>

                            <div className="h-px md:h-12 w-full md:w-px bg-white/20" />

                            <ProductStatsSummary products={products} />
                        </div>

                        <div className="flex flex-wrap gap-4">
                            {hasEditedProducts && onSaveAll && (
                                <Button
                                    onClick={onSaveAll}
                                    disabled={isSavingAll}
                                    className="bg-green-500 hover:bg-green-400 text-white border-0 rounded-2xl px-8 h-12 md:h-14 font-black shadow-2xl shadow-green-900/30 transition-all hover:scale-105 active:scale-95"
                                >
                                    {t('saveAll')}
                                </Button>
                            )}

                            <Button
                                onClick={onAutoGenerate}
                                className="bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-xl rounded-2xl px-6 h-12 md:h-14 font-bold transition-all hover:scale-105 active:scale-95 shadow-xl"
                            >
                                <Package className="mr-3 h-5 w-5" /> Auto Generate
                            </Button>

                            <Button
                                onClick={onImport}
                                className="bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-xl rounded-2xl px-6 h-12 md:h-14 font-bold transition-all hover:scale-105 active:scale-95 shadow-xl"
                            >
                                <Upload className="mr-3 h-5 w-5" /> {t('import')}
                            </Button>

                            <Button
                                onClick={onNewProduct}
                                className="bg-teal-400 hover:bg-teal-300 text-teal-950 border-0 rounded-2xl px-8 h-12 md:h-14 font-black shadow-2xl shadow-teal-900/40 transition-all hover:scale-105 active:scale-95"
                            >
                                <Plus className="mr-3 h-5 w-5" /> {t('newProduct')}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default ProductsHero;
