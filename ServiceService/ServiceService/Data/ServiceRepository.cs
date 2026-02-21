using ServiceService.Context;
using ServiceService.Models;
using ServiceService.Models.DTO;
using Microsoft.EntityFrameworkCore;

namespace ServiceService.Data
{
    public class ServiceRepository : IServiceRepository
    {
        private readonly ServiceContext _context;

        public ServiceRepository(ServiceContext context)
        {
            _context = context;
        }

        public IEnumerable<ServiceDTO> GetServices()
        {
            return _context.Services
                .AsNoTracking()
                .Select(s => new ServiceDTO
                {
                    Id = s.Id,
                    Name = s.Name,
                    Description = s.Description ?? string.Empty,
                    Price = s.Price,
                    Category = s.Category
                })
                .ToList();
        }

        public ServiceDTO? GetServiceById(Guid id)
        {
            var s = _context.Services.AsNoTracking().FirstOrDefault(x => x.Id == id);
            if (s == null) return null;

            return new ServiceDTO
            {
                Id = s.Id,
                Name = s.Name,
                Description = s.Description ?? string.Empty,
                Price = s.Price,
                Category = s.Category
            };
        }

        public ServiceDTO AddService(ServiceCreationDTO dto)
        {
            var entity = new Service
            {
                Id = Guid.NewGuid(),
                Name = dto.Name.Trim(),
                Description = dto.Description,
                Price = dto.Price,
                Category = dto.Category
            };

            _context.Services.Add(entity);
            _context.SaveChanges();

            return new ServiceDTO
            {
                Id = entity.Id,
                Name = entity.Name,
                Description = entity.Description ?? string.Empty,
                Price = entity.Price,
                Category = entity.Category
            };
        }

        public void UpdateService(Guid id, ServiceUpdateDTO dto)
        {
            var entity = _context.Services.FirstOrDefault(x => x.Id == id);
            if (entity == null) return;

            entity.Name = dto.Name.Trim();
            entity.Description = dto.Description;
            entity.Price = dto.Price;
            entity.Category = dto.Category;

            _context.SaveChanges();
        }

        public void DeleteService(Guid id)
        {
            var entity = _context.Services.FirstOrDefault(x => x.Id == id);
            if (entity == null) return;

            _context.Services.Remove(entity);
            _context.SaveChanges();
        }

        public decimal CalculateCost(Guid id, int quantity)
        {
            var service = _context.Services.FirstOrDefault(x => x.Id == id);
            if (service == null) return 0;

            return service.Price * quantity;
        }

        public bool ServiceExists(Guid id)
        {
            return _context.Services.Any(x => x.Id == id);
        }
    }
}