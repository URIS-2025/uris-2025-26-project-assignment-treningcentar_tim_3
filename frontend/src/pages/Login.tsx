import React from 'react';
import LoginForm from '../components/forms/LoginForm';

const Login: React.FC = () => {
    return (
        <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-amber-50 via-white to-orange-50 relative overflow-hidden">
            {/* Decorative Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-200/20 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-200/20 rounded-full blur-[100px] animate-pulse delay-700" />
            
            <div className="relative z-10 w-full animate-in fade-in zoom-in duration-500">
                <LoginForm />
            </div>
        </div>
    );
};

export default Login;