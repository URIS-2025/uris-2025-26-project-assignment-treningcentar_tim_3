using PaymentService.Models.DTO.Service;

namespace PaymentService.ServiceCalls.ServiceService
{
    public interface IServiceService
    {
        ServiceDTO GetServiceById(Guid id);
    }
}
