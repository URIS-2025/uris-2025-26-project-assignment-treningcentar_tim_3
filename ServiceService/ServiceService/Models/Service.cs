using ServiceService.Models.Enums;

namespace ServiceService.Models
{
    public class Service
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public ServiceCategory Category { get; set; }

    }
}
