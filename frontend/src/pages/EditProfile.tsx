import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, Check, AlertCircle, Save, ArrowLeft } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../store';
import { authService } from '../services/authService';
import { updateUserInfo } from '../store/slices/authSlice';

const EditProfile: React.FC = () => {
    const user = useSelector((state: RootState) => state.auth.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        username: '',
        role: ''
    });

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        if (user?.id) {
            authService.getUserProfile(user.id)
                .then(data => {
                    setFormData({
                        firstName: data.firstName || '',
                        lastName: data.lastName || '',
                        email: data.email || '',
                        username: data.username || '',
                        role: data.role || ''
                    });
                    setIsLoading(false);
                })
                .catch(err => {
                    console.error("Error fetching profile:", err);
                    setMessage({ text: "Failed to load profile data", type: 'error' });
                    setIsLoading(false);
                });
        }
    }, [user?.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);

        try {
            await authService.updateProfile({
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email
            });

            dispatch(updateUserInfo({ 
                fullName: `${formData.firstName} ${formData.lastName}` 
            }));

            setMessage({ text: "Profile updated successfully!", type: 'success' });
            setTimeout(() => setMessage(null), 3000);
        } catch (err: any) {
            setMessage({ text: err.message || "Failed to update profile", type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-2xl mx-auto space-y-8 animate-in fade-in duration-700">
            <button 
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-amber-900/40 hover:text-amber-600 font-black text-xs uppercase tracking-widest transition-all group"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back
            </button>

            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-amber-900/5 border border-amber-100 overflow-hidden">
                <div className="p-8 border-b border-amber-50 bg-neutral-50/50">
                    <h1 className="text-3xl font-black text-amber-950 tracking-tight">Edit Profile</h1>
                    <p className="text-amber-800/60 font-medium text-sm">Update your personal information</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {message && (
                        <div className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-bold animate-in zoom-in-95 duration-300 ${
                            message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                            {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                            {message.text}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* First Name */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-amber-900/40 uppercase tracking-[0.2em] ml-4">First Name</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-900/20 group-focus-within:text-amber-600 transition-colors" />
                                <input 
                                    type="text"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                                    className="w-full pl-12 pr-6 py-4 bg-neutral-50 border border-transparent focus:bg-white focus:border-amber-200 rounded-[1.4rem] outline-none transition-all font-bold text-amber-950 text-sm"
                                    required
                                />
                            </div>
                        </div>

                        {/* Last Name */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-amber-900/40 uppercase tracking-[0.2em] ml-4">Last Name</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-900/20 group-focus-within:text-amber-600 transition-colors" />
                                <input 
                                    type="text"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                                    className="w-full pl-12 pr-6 py-4 bg-neutral-50 border border-transparent focus:bg-white focus:border-amber-200 rounded-[1.4rem] outline-none transition-all font-bold text-amber-950 text-sm"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-amber-900/40 uppercase tracking-[0.2em] ml-4">Email Address</label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-900/20 group-focus-within:text-amber-600 transition-colors" />
                            <input 
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                className="w-full pl-12 pr-6 py-4 bg-neutral-50 border border-transparent focus:bg-white focus:border-amber-200 rounded-[1.4rem] outline-none transition-all font-bold text-amber-950 text-sm"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        {/* Username - Disabled */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-amber-900/40 uppercase tracking-[0.2em] ml-4">Username</label>
                            <div className="relative opacity-60">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                                <input 
                                    type="text"
                                    value={formData.username}
                                    disabled
                                    className="w-full pl-12 pr-6 py-4 bg-neutral-100 border-none rounded-[1.4rem] font-bold text-neutral-400 text-sm cursor-not-allowed"
                                />
                            </div>
                        </div>

                        {/* Role - Disabled */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-amber-900/40 uppercase tracking-[0.2em] ml-4">Your Role</label>
                            <div className="relative opacity-60">
                                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                                <input 
                                    type="text"
                                    value={formData.role}
                                    disabled
                                    className="w-full pl-12 pr-6 py-4 bg-neutral-100 border-none rounded-[1.4rem] font-bold text-neutral-400 text-sm cursor-not-allowed uppercase"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-8">
                        <button 
                            type="submit"
                            disabled={isSaving}
                            className="w-full py-5 bg-amber-600 hover:bg-amber-500 disabled:bg-amber-300 text-white font-black text-sm uppercase tracking-[0.2em] rounded-[1.5rem] transition-all shadow-xl shadow-amber-600/20 flex items-center justify-center gap-3 active:scale-[0.98]"
                        >
                            {isSaving ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <Save className="w-5 h-5" />
                            )}
                            {isSaving ? 'Updating...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProfile;
