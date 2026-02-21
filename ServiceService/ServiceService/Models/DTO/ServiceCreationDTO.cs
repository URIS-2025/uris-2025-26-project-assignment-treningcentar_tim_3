using System.ComponentModel.DataAnnotations;
using ServiceService.Models.Enums;

namespace ServiceService.Models.DTO
{
    /// DTO za kreiranje servisa.
    public class ServiceCreationDTO
    {
        [Required(ErrorMessage = "Name is required.")]
        [StringLength(200, MinimumLength = 2, ErrorMessage = "Name must be between 2 and 200 characters.")]
        public string Name { get; set; } = string.Empty;

        [StringLength(2000, ErrorMessage = "Description can be up to 2000 characters.")]
        public string? Description { get; set; }

        [Required(ErrorMessage = "Price is required.")]
        [Range(0.01, 1_000_000, ErrorMessage = "Price must be between 0.01 and 1,000,000.")]
        public decimal Price { get; set; }

        [Required(ErrorMessage = "Category is required.")]
        [EnumDataType(typeof(ServiceCategory))]
        public ServiceCategory Category { get; set; }
    }
}