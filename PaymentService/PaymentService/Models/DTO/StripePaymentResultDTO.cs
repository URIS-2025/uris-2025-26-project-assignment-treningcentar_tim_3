namespace PaymentService.Models.DTO
{
    public class StripePaymentResultDTO
    {
        public string PaymentIntentId { get; set; } = string.Empty;
        public string ClientSecret { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }
}
