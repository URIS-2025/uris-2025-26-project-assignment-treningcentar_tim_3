namespace PaymentService.Models.DTO.Service
{
    /// DTO koji predstavlja servis preuzet iz ServiceService-a.
    public class ServiceDTO
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string Category { get; set; } = string.Empty;
    }
}
