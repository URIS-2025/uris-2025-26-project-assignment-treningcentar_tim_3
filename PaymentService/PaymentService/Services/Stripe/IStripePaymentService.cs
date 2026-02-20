namespace PaymentService.Services.Stripe
{
    public interface IStripePaymentService
    {
        Task<string> CreatePaymentIntentAsync(decimal amount, string currency = "usd");
        Task<string> RefundPaymentAsync(string stripePaymentIntentId);
    }
}
