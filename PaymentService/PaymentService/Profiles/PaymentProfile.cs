using AutoMapper;
using PaymentService.Models;
using PaymentService.Models.DTO.Payment;

namespace PaymentService.Profiles
{
    public class PaymentProfile : Profile
    {
        public PaymentProfile()
        {
            CreateMap<Payment, PaymentDTO>();
            CreateMap<PaymentCreationDTO, Payment>();
        }
    }
}
