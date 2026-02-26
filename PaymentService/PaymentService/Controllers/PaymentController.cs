using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PaymentService.Data;
using PaymentService.Models.DTO.Payment;
using PaymentService.ServiceCalls.Logger;
using PaymentService.ServiceCalls.Logger.DTO;

namespace PaymentService.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentController : Controller
    {
        private readonly IPaymentRepository _paymentRepository;
        private readonly IMapper _mapper;
        private readonly ILoggerService _logger;

        public PaymentController(IPaymentRepository paymentRepository, IMapper mapper, ILoggerService logger)
        {
            _paymentRepository = paymentRepository;
            _mapper = mapper;
            _logger = logger;
        }

        [HttpGet]
        [HttpHead]
        [Authorize(Roles = "Admin,Receptionist")]
        public ActionResult<IEnumerable<PaymentDTO>> GetPayments()
        {
            var payments = _paymentRepository.GetPayments();
            if (payments == null || !payments.Any())
            {
                _ = _logger.TryLogAsync(new LogCreationDTO
                {
                    Level = LogLevels.Info,
                    ServiceName = "PaymentService",
                    Action = "GetPayments",
                    Message = "No payments found."
                });
                return NoContent();
            }

            _ = _logger.TryLogAsync(new LogCreationDTO
            {
                Level = LogLevels.Info,
                ServiceName = "PaymentService",
                Action = "GetPayments",
                Message = $"Returned {payments.Count()} payment(s)."
            });

            return Ok(payments);
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Receptionist,Member")]
        public ActionResult<PaymentDTO> GetPaymentById(Guid id)
        {
            var payment = _paymentRepository.GetPaymentById(id);
            if (payment == null)
            {
                _ = _logger.TryLogAsync(new LogCreationDTO
                {
                    Level = LogLevels.Warning,
                    ServiceName = "PaymentService",
                    Action = "GetPaymentById",
                    Message = $"Payment with id {id} not found.",
                    EntityId = id,
                    EntityType = "Payment"
                });
                return NotFound();
            }

            _ = _logger.TryLogAsync(new LogCreationDTO
            {
                Level = LogLevels.Info,
                ServiceName = "PaymentService",
                Action = "GetPaymentById",
                Message = $"Payment with id {id} fetched successfully.",
                EntityId = id,
                EntityType = "Payment"
            });

            return Ok(payment);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Receptionist,Member")]
        public ActionResult<PaymentConfirmationDTO> AddPayment([FromBody] PaymentCreationDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            try
            {
                var created = _paymentRepository.AddPayment(dto);

                _ = _logger.TryLogAsync(new LogCreationDTO
                {
                    Level = LogLevels.Info,
                    ServiceName = "PaymentService",
                    Action = "AddPayment",
                    Message = "New payment created successfully.",
                    EntityType = "Payment"
                });

                return Created("", created);
            }
            catch (Exception ex)
            {
                _ = _logger.TryLogAsync(new LogCreationDTO
                {
                    Level = LogLevels.Error,
                    ServiceName = "PaymentService",
                    Action = "AddPayment",
                    Message = "Failed to create payment.",
                    Details = ex.Message
                });
                return BadRequest(new { error = ex.Message, detail = ex.InnerException?.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Receptionist,Member")]
        public ActionResult<PaymentConfirmationDTO> UpdatePaymentStatus(Guid id, [FromBody] PaymentStatusUpdateDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            try
            {
                if (id != dto.Id) return BadRequest("Route id and body id mismatch.");

                var updated = _paymentRepository.UpdatePaymentStatus(dto);

                if (updated == null)
                {
                    _ = _logger.TryLogAsync(new LogCreationDTO
                    {
                        Level = LogLevels.Warning,
                        ServiceName = "PaymentService",
                        Action = "UpdatePaymentStatus",
                        Message = $"Update failed — payment {id} not found or invalid.",
                        EntityId = id,
                        EntityType = "Payment"
                    });
                    return BadRequest();
                }

                _ = _logger.TryLogAsync(new LogCreationDTO
                {
                    Level = LogLevels.Info,
                    ServiceName = "PaymentService",
                    Action = "UpdatePaymentStatus",
                    Message = $"Payment {id} status updated successfully.",
                    EntityId = id,
                    EntityType = "Payment"
                });

                return Ok(updated);
            }
            catch
            {
                _ = _logger.TryLogAsync(new LogCreationDTO
                {
                    Level = LogLevels.Error,
                    ServiceName = "PaymentService",
                    Action = "UpdatePaymentStatus",
                    Message = $"Exception while updating payment {id}.",
                    EntityId = id,
                    EntityType = "Payment"
                });
                return BadRequest();
            }
        }

        [HttpPost("{paymentId}/refund")]
        [Authorize(Roles = "Admin,Receptionist")]
        public ActionResult<PaymentConfirmationDTO> RefundPayment(Guid paymentId)
        {
            try
            {
                var paymentToCheck = _paymentRepository.GetPaymentById(paymentId);
                if (paymentToCheck == null)
                {
                    _ = _logger.TryLogAsync(new LogCreationDTO
                    {
                        Level = LogLevels.Warning,
                        ServiceName = "PaymentService",
                        Action = "RefundPayment",
                        Message = $"Refund failed — payment {paymentId} not found.",
                        EntityId = paymentId,
                        EntityType = "Payment"
                    });
                    return NotFound();
                }

                var refunded = _paymentRepository.RefundPayment(paymentId);
                if (refunded == null)
                {
                    _ = _logger.TryLogAsync(new LogCreationDTO
                    {
                        Level = LogLevels.Error,
                        ServiceName = "PaymentService",
                        Action = "RefundPayment",
                        Message = $"Refund operation returned null for payment {paymentId}.",
                        EntityId = paymentId,
                        EntityType = "Payment"
                    });
                    return BadRequest();
                }

                _ = _logger.TryLogAsync(new LogCreationDTO
                {
                    Level = LogLevels.Info,
                    ServiceName = "PaymentService",
                    Action = "RefundPayment",
                    Message = $"Payment {paymentId} refunded successfully.",
                    EntityId = paymentId,
                    EntityType = "Payment"
                });

                return Ok(refunded);
            }
            catch
            {
                _ = _logger.TryLogAsync(new LogCreationDTO
                {
                    Level = LogLevels.Error,
                    ServiceName = "PaymentService",
                    Action = "RefundPayment",
                    Message = $"Exception during refund of payment {paymentId}.",
                    EntityId = paymentId,
                    EntityType = "Payment"
                });
                return BadRequest();
            }
        }

        [HttpDelete("{paymentId}")]
        [Authorize(Roles = "Admin")]
        public IActionResult DeletePayment(Guid paymentId)
        {
            try
            {
                var payment = _paymentRepository.GetPaymentById(paymentId);
                if (payment == null)
                {
                    _ = _logger.TryLogAsync(new LogCreationDTO
                    {
                        Level = LogLevels.Warning,
                        ServiceName = "PaymentService",
                        Action = "DeletePayment",
                        Message = $"Delete failed — payment {paymentId} not found.",
                        EntityId = paymentId,
                        EntityType = "Payment"
                    });
                    return NotFound();
                }

                _paymentRepository.DeletePayment(paymentId);

                _ = _logger.TryLogAsync(new LogCreationDTO
                {
                    Level = LogLevels.Info,
                    ServiceName = "PaymentService",
                    Action = "DeletePayment",
                    Message = $"Payment {paymentId} deleted successfully.",
                    EntityId = paymentId,
                    EntityType = "Payment"
                });

                return NoContent();
            }
            catch
            {
                _ = _logger.TryLogAsync(new LogCreationDTO
                {
                    Level = LogLevels.Error,
                    ServiceName = "PaymentService",
                    Action = "DeletePayment",
                    Message = $"Exception during delete of payment {paymentId}.",
                    EntityId = paymentId,
                    EntityType = "Payment"
                });
                return StatusCode(StatusCodes.Status500InternalServerError, "Delete Error");
            }
        }

        [HttpOptions]
        [AllowAnonymous]
        public IActionResult GetPaymentOptions()
        {
            _ = _logger.TryLogAsync(new LogCreationDTO
            {
                Level = LogLevels.Info,
                ServiceName = "PaymentService",
                Action = "GetPaymentOptions",
                Message = "OPTIONS requested across endpoints."
            });

            Response.Headers.Append("Allow", "GET, POST, PUT, DELETE, OPTIONS");
            return Ok();
        }
    }
}