using AutoMapper;
using ReservationService.Models;
using ReservationService.Models.DTO;

namespace ReservationService.Profiles;

public class TrainingHallProfile : Profile
{
    public TrainingHallProfile()
    {
        CreateMap<TrainingHall, TrainingHallDto>();
        CreateMap<TrainingHall, TrainingHallConfirmationDto>();
        CreateMap<TrainingHallCreateDto, TrainingHall>();
        CreateMap<TrainingHallUpdateDto, TrainingHall>();
    }
}