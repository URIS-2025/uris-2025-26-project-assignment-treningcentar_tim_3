namespace PaymentService.ServiceCalls.Stripe
{
    public interface IStripePaymentService
    {
        Task<string> CreatePaymentIntentAsync(decimal amount, string currency = "usd");
        Task<string> RefundPaymentAsync(string stripePaymentIntentId);
    }
}
