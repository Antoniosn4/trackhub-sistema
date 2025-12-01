import React from 'react';

// Botão Genérico
export const Button = ({ children, variant = 'primary', onClick, icon: Icon, className = '', type = 'button' }) => {
    const variants = {
        primary: "bg-blue-600 text-white hover:bg-blue-700",
        success: "bg-emerald-500 text-white hover:bg-emerald-600",
        danger: "bg-rose-500 text-white hover:bg-rose-600",
        ghost: "text-slate-600 hover:bg-slate-100"
    };

    return (
        <button
            type={type}
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all active:scale-95 ${variants[variant]} ${className}`}
        >
            {Icon && <Icon size={18} />}
            {children}
        </button>
    );
};

// Card Genérico
export const Card = ({ children, className = '' }) => (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 ${className}`}>
        {children}
    </div>
);

// Badge Genérica
export const Badge = ({ children, color = 'blue' }) => {
    const map = {
        blue: 'bg-blue-50 text-blue-700 border-blue-100',
        purple: 'bg-purple-50 text-purple-700 border-purple-100',
        amber: 'bg-amber-50 text-amber-700 border-amber-100'
    };
    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${map[color] || map.blue}`}>
            {children}
        </span>
    );
};