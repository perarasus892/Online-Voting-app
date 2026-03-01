import React from 'react';

interface SymbolRendererProps {
    symbol: string;
    className?: string;
}

export const SymbolRenderer: React.FC<SymbolRendererProps> = ({ symbol, className = "w-full h-full object-contain" }) => {
    // Check if symbol is a path or base64
    const isImage = symbol.startsWith('/') ||
        symbol.startsWith('http') ||
        symbol.startsWith('data:image') ||
        /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(symbol);

    if (isImage) {
        return <img src={symbol} alt="Symbol" className={className} />;
    }

    // Handle it as an emoji or text
    return <div className={`flex items-center justify-center whitespace-nowrap flex-shrink-0 ${className}`}>{symbol}</div>;
};
