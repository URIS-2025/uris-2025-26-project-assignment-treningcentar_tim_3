import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';

const NutritionistHome: React.FC = () => {
    const user = useSelector((state: RootState) => state.auth.user);

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex flex-col items-center justify-center p-8">
            <div className="text-center max-w-lg">
                {/* Icon */}
                <div className="w-20 h-20 bg-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-amber-600/20">
                    <span className="text-4xl">🥗</span>
                </div>

                {/* Greeting */}
                <h1 className="text-4xl font-black text-amber-950 tracking-tight mb-2">
                    Dobrodošli, {user?.fullName?.split(' ')[0] ?? 'Nutricionista'}!
                </h1>
                <p className="text-amber-900/50 text-lg mb-10">
                    Nutricionista panel · Training Center
                </p>

                {/* Single action card */}
                <Link
                    to="/nutritionist/measurement-appointments"
                    className="flex items-center gap-4 bg-white rounded-2xl p-6 shadow-lg shadow-amber-900/5 border border-amber-100 hover:shadow-xl hover:border-amber-300 transition-all group text-left"
                >
                    <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-amber-600 transition-colors">
                        <span className="text-2xl group-hover:grayscale-0">📅</span>
                    </div>
                    <div className="flex-1">
                        <p className="font-black text-amber-950 text-lg">Termini mjerenja</p>
                        <p className="text-sm text-amber-900/50 mt-0.5">
                            Pregledi, kreiranje novih termina i praćenje rezultata
                        </p>
                    </div>
                    <span className="text-amber-300 group-hover:text-amber-600 text-xl transition-colors">→</span>
                </Link>
            </div>
        </div>
    );
};

export default NutritionistHome;
