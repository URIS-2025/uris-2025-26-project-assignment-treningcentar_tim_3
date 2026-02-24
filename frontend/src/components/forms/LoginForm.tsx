import { useState } from 'react';
import { authService } from '../../services/authService';
import { useNavigate } from 'react-router-dom';
import { Role } from '../../types/auth';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../store/slices/authSlice';

const LoginForm = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });

    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        try {
            const data = await authService.login(formData);
            
            // Dispatch to Redux store for immediate UI updates
            dispatch(setCredentials({
                user: data.user,
                role: data.role,
                token: data.token,
                id: data.id
            }));

            setMessage({ text: 'Login successful!', type: 'success' });
            
            // Navigate based on role (Member goes to dashboard)
            setTimeout(() => {
                if (data.role === Role.Member) {
                    navigate('/dashboard');
                } else {
                    navigate('/');
                }
            }, 1000);
        } catch (error: any) {
            setMessage({ text: error.message || 'Invalid credentials', type: 'error' });
        }
    };

    return (
        <div className="max-w-md w-full mx-auto">
            <div className="relative p-1 rounded-[2rem] bg-gradient-to-b from-amber-200/50 to-orange-300/30 shadow-2xl backdrop-blur-xl">
                <div className="bg-white/90 backdrop-blur-md rounded-[1.8rem] p-10 border border-white/50 shadow-inner">
                    <div className="mb-10 text-center relative">
                        
                        <h2 className="text-3xl font-black text-amber-950 mb-3 tracking-tight">Welcome Back</h2>
                        <p className="text-amber-800/60 font-medium">Elevate your training experience</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-amber-900 uppercase tracking-widest ml-1">Username</label>
                            <div className="relative group">
                                
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-5 pr-4 py-4 bg-amber-50/30 border-2 border-amber-100 rounded-2xl text-amber-900 focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10 transition-all placeholder-amber-900/20"
                                    placeholder="your_username"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-xs font-bold text-amber-900 uppercase tracking-widest">Password</label>
                                {/* <a href="#" className="text-xs font-semibold text-amber-600 hover:text-amber-500 transition-colors">Forgot?</a> */}
                            </div>
                            <div className="relative group">
                               
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-5 pr-4 py-4 bg-amber-50/30 border-2 border-amber-100 rounded-2xl text-amber-900 focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10 transition-all placeholder-amber-900/20"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {message && (
                            <div className={`p-4 rounded-2xl text-sm font-semibold flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
                                message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                            }`}>
                                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-white/50">
                                    {message.type === 'success' ? '✓' : '!'}
                                </span>
                                {message.text}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="group relative w-full overflow-hidden rounded-2xl bg-amber-600 py-4 font-bold text-white shadow-[0_10px_20px_-10px_rgba(217,119,6,0.5)] transition-all hover:scale-[1.02] hover:shadow-[0_15px_30px_-10px_rgba(217,119,6,0.6)] active:scale-[0.98]"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                Sign In
                                <span className="group-hover:translate-x-1 transition-transform">→</span>
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>

                        <div className="text-center text-sm font-medium pt-2">
                            <span className="text-amber-900/40">New here?</span>{' '}
                            <a href="/register" className="text-amber-600 hover:text-amber-500 font-bold transition-all hover:underline underline-offset-4 decoration-2">
                                Create an account
                            </a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginForm;
