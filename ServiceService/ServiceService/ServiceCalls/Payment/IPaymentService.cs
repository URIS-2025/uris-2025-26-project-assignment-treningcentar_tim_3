using ServiceService.ServiceCalls.Payment.DTO;

namespace ServiceService.ServiceCalls.Payment
{
    public interface IPaymentService
    {
        PaymentDTO GetPaymentById(Guid id);
    }
}