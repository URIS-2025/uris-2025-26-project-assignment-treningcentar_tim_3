using PaymentService.Models.DTO.Payment;

namespace PaymentService.Data
{
    public interface IPaymentRepository
    {
        IEnumerable<PaymentDTO> GetPayments();
        PaymentDTO GetPaymentById(Guid id);
        PaymentConfirmationDTO AddPayment(PaymentCreationDTO payment);
        PaymentConfirmationDTO UpdatePaymentStatus(PaymentStatusUpdateDTO dto);
        PaymentConfirmationDTO RefundPayment(Guid id);
        void DeletePayment(Guid id);
    }
}
