using ServiceService.Domain.Enums;

namespace ServiceService.Domain.Entities
{
    public class Service
    {
        public int ServiceId { get; set; } 
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public ServiceCategory Category { get; set; }

    }
}
