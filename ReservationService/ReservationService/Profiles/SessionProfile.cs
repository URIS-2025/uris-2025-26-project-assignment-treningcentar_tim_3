using AutoMapper;
using ReservationService.Models;
using ReservationService.Models.DTO;
using ReservationService.Models.DTO.MemberDtos;

namespace ReservationService.Profiles
{
    public class SessionProfile : Profile
    {
        public SessionProfile()
        {
            // Entity -> DTO
            CreateMap<Session, SessionDto>()
                .Include<GroupSession, SessionDto>()
                .Include<PersonalSession, SessionDto>()
                .ForMember(dest => dest.SessionId, opt => opt.MapFrom(src => src.sessionId))
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.name))
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.status))
                .ForMember(dest => dest.TrainingType, opt => opt.MapFrom(src => src.trainingType))
                .ForMember(dest => dest.TrainerId, opt => opt.MapFrom(src => new TrainerDto { Id = src.trainerId }))
                .ForMember(dest => dest.MaxCapacity, opt => opt.Ignore())
                .ForMember(dest => dest.TrainingHallId, opt => opt.Ignore())
                .ForMember(dest => dest.TrainingHallName, opt => opt.Ignore());

            CreateMap<GroupSession, SessionDto>()
                .IncludeBase<Session, SessionDto>()
                .ForMember(dest => dest.MaxCapacity, opt => opt.MapFrom(src => src.maxCapacity))
                .ForMember(dest => dest.TrainingHallId, opt => opt.MapFrom(src => src.trainingHallId));

            CreateMap<PersonalSession, SessionDto>()
                .IncludeBase<Session, SessionDto>()
                .ForMember(dest => dest.MaxCapacity, opt => opt.Ignore())
                .ForMember(dest => dest.TrainingHallId, opt => opt.Ignore())
                .ForMember(dest => dest.TrainingHallName, opt => opt.Ignore());

            // DTO -> Entity
            CreateMap<SessionDto, GroupSession>()
                .ForMember(dest => dest.sessionId, opt => opt.MapFrom(src => src.SessionId))
                .ForMember(dest => dest.name, opt => opt.MapFrom(src => src.Name))
                .ForMember(dest => dest.status, opt => opt.MapFrom(src => src.Status))
                .ForMember(dest => dest.trainingType, opt => opt.MapFrom(src => src.TrainingType))
                .ForMember(dest => dest.trainerId, opt => opt.MapFrom(src => src.TrainerId != null ? src.TrainerId.Id : Guid.Empty))
                .ForMember(dest => dest.maxCapacity, opt => opt.MapFrom(src => src.MaxCapacity ?? 0))
                .ForMember(dest => dest.trainingHallId, opt => opt.MapFrom(src => src.TrainingHallId ?? Guid.Empty));

            CreateMap<SessionDto, PersonalSession>()
                .ForMember(dest => dest.sessionId, opt => opt.MapFrom(src => src.SessionId))
                .ForMember(dest => dest.name, opt => opt.MapFrom(src => src.Name))
                .ForMember(dest => dest.status, opt => opt.MapFrom(src => src.Status))
                .ForMember(dest => dest.trainingType, opt => opt.MapFrom(src => src.TrainingType))
                .ForMember(dest => dest.trainerId, opt => opt.MapFrom(src => src.TrainerId != null ? src.TrainerId.Id : Guid.Empty));
        }
    }
}