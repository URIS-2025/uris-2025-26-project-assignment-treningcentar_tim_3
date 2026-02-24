using AutoMapper;
using MeasurmentService.Models;
using MeasurmentService.Models.DTO;

namespace MeasurmentService.Profiles;

public class MeasurementProfile : Profile
{
    public MeasurementProfile()
    {
        CreateMap<Guideline, GuidelineDTO>();

        CreateMap<GuidelineCreateDTO, Guideline>()
            .ForMember(d => d.LastUpdated, o => o.MapFrom(_ => DateTime.UtcNow));

        CreateMap<MeasurementAppointment, MeasurementAppointmentDTO>()
            .ForMember(d => d.WeightKg, o => o.MapFrom(s => s.Measurements.WeightKg))
            .ForMember(d => d.HeightCm, o => o.MapFrom(s => s.Measurements.HeightCm))
            .ForMember(d => d.BodyFatPercent, o => o.MapFrom(s => s.Measurements.BodyFatPercent))
            .ForMember(d => d.GuidelineId, o => o.MapFrom(s => s.Guideline != null ? s.Guideline.GuidelineId : (Guid?)null));

        // BITNO: Create/Update termina više NE upisuje rezultate merenja
        CreateMap<MeasurementAppointmentCreateDTO, MeasurementAppointment>()
            .ForMember(d => d.Measurements, o => o.Ignore());
    }
}