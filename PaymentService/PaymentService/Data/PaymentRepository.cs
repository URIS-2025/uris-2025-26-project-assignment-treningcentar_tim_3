using AutoMapper;
using PaymentService.Context;
using PaymentService.Models;
using PaymentService.Models.DTO;
using PaymentService.Models.Enums;
using PaymentService.Services.Stripe;

namespace PaymentService.Data
{
    public class PaymentRepository : IPaymentRepository
    {
        private readonly PaymentContext _context;
        private readonly IMapper _mapper;
        private readonly IStripePaymentService _stripePaymentService;

        public PaymentRepository(PaymentContext context, IMapper mapper, IStripePaymentService stripePaymentService)
        {
            _context = context;
            _mapper = mapper;
            _stripePaymentService = stripePaymentService;
        }

        public PaymentConfirmationDTO AddPayment(PaymentCreationDTO payment)
        {
            var newPayment = new Payment
            {
                Id = Guid.NewGuid(),
                Amount = payment.Amount,
                PaymentDate = DateTime.SpecifyKind(payment.PaymentDate, DateTimeKind.Utc),
                Method = payment.Method,
                Status = PaymentStatus.Pending,
                ReservationId = payment.ReservationId,
                ServiceId = payment.ServiceId
            };

            // Ako je metoda kartična — pozovi Stripe
            if (payment.Method == PaymentMethod.Card)
            {
                var paymentIntentId = _stripePaymentService
                    .CreatePaymentIntentAsync(payment.Amount)
                    .GetAwaiter()
                    .GetResult();

                newPayment.StripePaymentIntentId = paymentIntentId;
                newPayment.Status = PaymentStatus.Completed; // Stripe je potvrdio
            }

            _context.Payments.Add(newPayment);
            _context.SaveChanges();

            return new PaymentConfirmationDTO
            {
                PaymentId = newPayment.Id,
                Status = newPayment.Status,
                Amount = newPayment.Amount,
                PaymentDate = newPayment.PaymentDate,
                Method = newPayment.Method
            };
        }

        public void DeletePayment(Guid id)
        {
            var payment = _context.Payments.FirstOrDefault(p => p.Id == id);
            if (payment != null)
            {
                _context.Remove(payment);
                _context.SaveChanges();
            }
        }

        public PaymentDTO GetPaymentById(Guid id)
        {
            var payment = _context.Payments.FirstOrDefault(p => p.Id == id);
            if (payment == null) return null;

            return _mapper.Map<PaymentDTO>(payment);
        }

        public IEnumerable<PaymentDTO> GetPayments()
        {
            var payments = _context.Payments.ToList();
            return _mapper.Map<IEnumerable<PaymentDTO>>(payments);
        }

        public PaymentConfirmationDTO UpdatePaymentStatus(PaymentStatusUpdateDTO dto)
        {
            var payment = _context.Payments.FirstOrDefault(p => p.Id == dto.Id);
            if (payment == null) return null;

            var current = payment.Status;
            var next = dto.Status;

            var allowed =
                (current == PaymentStatus.Pending && (next == PaymentStatus.Completed || next == PaymentStatus.Failed)) ||
                (current == PaymentStatus.Completed && next == PaymentStatus.Refunded);

            if (!allowed)
            {
                return null;
            }

            payment.Status = next;
            _context.SaveChanges();

            return new PaymentConfirmationDTO
            {
                PaymentId = payment.Id,
                Status = payment.Status,
                Amount = payment.Amount,
                PaymentDate = payment.PaymentDate,
                Method = payment.Method
            };
        }

        public PaymentConfirmationDTO RefundPayment(Guid id)
        {
            var payment = _context.Payments.FirstOrDefault(p => p.Id == id);
            if (payment == null) return null;

            if (payment.Status != PaymentStatus.Completed)
            {
                return null;
            }

            // Ako je kartično plaćanje — refunduj na Stripe-u
            if (payment.Method == PaymentMethod.Card && !string.IsNullOrEmpty(payment.StripePaymentIntentId))
            {
                _stripePaymentService
                    .RefundPaymentAsync(payment.StripePaymentIntentId)
                    .GetAwaiter()
                    .GetResult();
            }

            payment.Status = PaymentStatus.Refunded;
            _context.SaveChanges();

            return new PaymentConfirmationDTO
            {
                PaymentId = payment.Id,
                Status = payment.Status,
                Amount = payment.Amount,
                PaymentDate = payment.PaymentDate,
                Method = payment.Method
            };
        }
    }
}
