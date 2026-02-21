using ServiceService.Models.DTO;

namespace ServiceService.Data
{
    public interface IServiceRepository
    {
        IEnumerable<ServiceDTO> GetServices();

        ServiceDTO? GetServiceById(Guid id);

        ServiceDTO AddService(ServiceCreationDTO service);

        void UpdateService(Guid id, ServiceUpdateDTO service);

        void DeleteService(Guid id);

        decimal CalculateCost(Guid id, int quantity);

        bool ServiceExists(Guid id);
    }
}