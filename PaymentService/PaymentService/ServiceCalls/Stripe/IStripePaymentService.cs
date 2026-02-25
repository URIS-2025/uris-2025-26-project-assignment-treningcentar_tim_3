namespace PaymentService.ServiceCalls.Stripe
{
    public interface IStripePaymentService
    {
        Task<(string id, string clientSecret)> CreatePaymentIntentAsync(decimal amount, string currency = "usd");
        Task<string> RefundPaymentAsync(string stripePaymentIntentId);
    }
}
