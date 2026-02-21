using System;
using ServiceService.Models.Enums;

namespace ServiceService.Models.DTO
{
    /// DTO za prikaz servisa.
    public class ServiceDTO
    {
        public Guid Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public decimal Price { get; set; }

        public ServiceCategory Category { get; set; }
    }
}