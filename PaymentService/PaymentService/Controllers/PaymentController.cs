using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PaymentService.Data;
using PaymentService.Models.DTO.Payment;

namespace PaymentService.Controllers { 
     
   // [Authorize] ubaciti kad se uradi taj servis obavezno!! 
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentController :Controller
    {
    private readonly IPaymentRepository _paymentRepository;
    private readonly IMapper _mapper;

    public PaymentController(IPaymentRepository paymentRepository, IMapper mapper)
    {
        _paymentRepository = paymentRepository;
        _mapper = mapper;
    }

    [HttpGet]
    [HttpHead]
    public ActionResult<IEnumerable<PaymentDTO>> GetPayments()
    {
        var payments = _paymentRepository.GetPayments();
        if (payments == null || !payments.Any())
            return NoContent();

        return Ok(payments);
    }

    [HttpGet("{id}")]
    public ActionResult<PaymentDTO> GetPaymentById(Guid id)
    {
        var payment = _paymentRepository.GetPaymentById(id);
        if (payment == null)
            return NotFound();

        return Ok(payment);
    }

    [HttpPost]
    public ActionResult<PaymentConfirmationDTO> AddPayment([FromBody] PaymentCreationDTO dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);
        try
        {
            var created = _paymentRepository.AddPayment(dto);
            return Created("", created);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message, detail = ex.InnerException?.Message });
        }
    }
        [HttpPut("{id}")]
        public ActionResult<PaymentConfirmationDTO> UpdatePaymentStatus(Guid id, [FromBody] PaymentStatusUpdateDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            try
            {
                if (id != dto.Id) return BadRequest("Route id and body id mismatch.");

                var updated = _paymentRepository.UpdatePaymentStatus(dto);

                if (updated == null)
                    return BadRequest(); // ovde ti ulazi i kad ne postoji i kad nije allowed (pošto repo vraća null za oba)

                return Ok(updated);
            }
            catch
            {
                return BadRequest();
            }
        }

        [HttpPost("{paymentId}/refund")]
    public ActionResult<PaymentConfirmationDTO> RefundPayment(Guid paymentId)
    {
        try
        {
            var paymentToCheck = _paymentRepository.GetPaymentById(paymentId);
            if (paymentToCheck == null)
                return NotFound();

            var refunded = _paymentRepository.RefundPayment(paymentId);
            if (refunded == null)
                return BadRequest();

            return Ok(refunded);
        }
        catch
        {
            return BadRequest();
        }
    }

    [HttpDelete("{paymentId}")]
    public IActionResult DeletePayment(Guid paymentId)
    {
        try
        {
            var payment = _paymentRepository.GetPaymentById(paymentId);
            if (payment == null)
                return NotFound();

            _paymentRepository.DeletePayment(paymentId);
            return NoContent();
        }
        catch
        {
            return StatusCode(StatusCodes.Status500InternalServerError, "Delete Error");
        }
    }

    //deo dodat za obezbedjivanje bezbednosti i sigurnosti vezbe 9. 
    [HttpOptions]
    [AllowAnonymous]
    public IActionResult GetPaymentOptions()
    {
        Response.Headers.Add("Allow", "GET, POST, PUT, DELETE, OPTIONS");
        return Ok();
    }


    }
}
