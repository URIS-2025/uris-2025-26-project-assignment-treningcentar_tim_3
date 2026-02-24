using Stripe;

namespace PaymentService.ServiceCalls.Stripe
{
    public class StripePaymentService : IStripePaymentService
    {
        public async Task<string> CreatePaymentIntentAsync(decimal amount, string currency = "usd")
        {
            var options = new PaymentIntentCreateOptions
            {
                Amount = (long)(amount * 100), // zbog toga sto stripe radi sa centima pa se mora konvertovati
                Currency = currency,
                PaymentMethodTypes = new List<string> { "card" },
            };

            var service = new PaymentIntentService();
            var intent = await service.CreateAsync(options);

            return intent.Id;
        }

        public async Task<string> RefundPaymentAsync(string stripePaymentIntentId)
        {
            var options = new RefundCreateOptions
            {
                PaymentIntent = stripePaymentIntentId,
            };

            var service = new RefundService();
            var refund = await service.CreateAsync(options);

            return refund.Id;
        }
    }
}
