import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
    Elements,
    CardElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';
import { X, CreditCard, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface CheckoutFormProps {
    clientSecret: string;
    amount: number;
    onSuccess: () => void;
    onCancel: () => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ clientSecret, amount, onSuccess, onCancel }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements) return;

        setProcessing(true);

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) return;

        const result = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: cardElement,
            },
        });

        if (result.error) {
            setError(result.error.message || 'An error occurred during payment.');
            setProcessing(false);
        } else {
            if (result.paymentIntent.status === 'succeeded') {
                onSuccess();
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-neutral-50 border border-neutral-100 p-4 rounded-2xl">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-black text-neutral-400 uppercase tracking-widest">Total to Pay</span>
                    <span className="text-xl font-black text-neutral-900">${amount}</span>
                </div>
                
                <div className="p-3 bg-white border border-neutral-200 rounded-xl shadow-sm">
                    <CardElement 
                        options={{
                            style: {
                                base: {
                                    fontSize: '16px',
                                    color: '#171717',
                                    '::placeholder': { color: '#a3a3a3' },
                                },
                                invalid: { color: '#ef4444' },
                            },
                        }} 
                    />
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100">
                    <AlertCircle className="w-4 h-4" /> {error}
                </div>
            )}

            <div className="flex gap-3">
                <button type="button" onClick={onCancel} disabled={processing}
                    className="flex-1 py-3 text-sm font-bold text-neutral-500 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-all">
                    Cancel
                </button>
                <button type="submit" disabled={!stripe || processing}
                    className="flex-[2] py-3 text-sm font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-lg shadow-amber-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    {processing ? 'Processing...' : 'Secure Pay Now'}
                </button>
            </div>

            <p className="text-[10px] text-center text-neutral-400 font-medium">
                Payments are secured and encrypted by Stripe.
            </p>
        </form>
    );
};

interface StripePaymentModalProps {
    clientSecret: string;
    amount: number;
    onSuccess: () => void;
    onClose: () => void;
}

const StripePaymentModal: React.FC<StripePaymentModalProps> = ({ clientSecret, amount, onSuccess, onClose }) => {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-amber-50 overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8 border-b border-neutral-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-xl">
                            <CreditCard className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-neutral-900">Secure Payment</h3>
                            <p className="text-xs text-neutral-500 font-medium tracking-tight">Enter your card details</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-neutral-400" />
                    </button>
                </div>
                
                <div className="p-8">
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                        <CheckoutForm 
                            clientSecret={clientSecret} 
                            amount={amount} 
                            onSuccess={onSuccess} 
                            onCancel={onClose} 
                        />
                    </Elements>
                </div>
            </div>
        </div>
    );
};

export default StripePaymentModal;
