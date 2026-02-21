using ServiceService.ServiceCalls.Measurement.DTO;

namespace ServiceService.ServiceCalls.Measurement
{
    public interface IMeasurementService
    {
        MeasurementDTO GetMeasurementAppointmentById(Guid id);
    }
}