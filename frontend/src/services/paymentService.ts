import { authService } from './authService';

const PAYMENT_API = 'http://localhost:5219/api/Payment';

export const PaymentMethod = {
    Card: 0,
    BankTransfer: 1,
    Cash: 2
} as const;
export type PaymentMethod = typeof PaymentMethod[keyof typeof PaymentMethod];

export const PaymentStatus = {
    Pending: 0,
    Completed: 1,
    Failed: 2,
    Refunded: 3
} as const;
export type PaymentStatus = typeof PaymentStatus[keyof typeof PaymentStatus];

export interface PaymentCreationDTO {
    amount: number;
    paymentDate: string;
    method: PaymentMethod;
    serviceId: string; // Ovo je zapravo PackageId u kontekstu Membership-a
}

export interface PaymentConfirmationDTO {
    paymentId: string;
    status: PaymentStatus;
    amount: number;
    paymentDate: string;
    method: PaymentMethod;
    clientSecret?: string;
}

const getHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${authService.getToken()}`,
});

export const paymentService = {
    async createPayment(dto: PaymentCreationDTO): Promise<PaymentConfirmationDTO> {
        const response = await fetch(PAYMENT_API, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(dto),
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to create payment intent');
        }
        return response.json();
    },

    async updatePaymentStatus(id: string, status: PaymentStatus): Promise<void> {
        const response = await fetch(`${PAYMENT_API}/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ id, status }),
        });
        if (!response.ok) throw new Error('Failed to update payment status');
    }
};
