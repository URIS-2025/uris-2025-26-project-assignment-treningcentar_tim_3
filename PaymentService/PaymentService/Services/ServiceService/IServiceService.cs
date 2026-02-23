using PaymentService.Models.DTO.Service;

namespace PaymentService.Services.ServiceService
{
    public interface IServiceService
    {
        ServiceDTO GetServiceById(Guid id);
    }
}
