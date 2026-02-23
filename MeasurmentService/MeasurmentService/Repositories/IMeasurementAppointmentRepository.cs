using MeasurmentService.Models;

namespace MeasurmentService.Repositories;

public interface IMeasurementAppointmentRepository
{
    Task<List<MeasurementAppointment>> GetAllVisibleAsync(Guid userId, string role);
    Task<MeasurementAppointment?> GetByIdAsync(Guid id);

    Task AddAsync(MeasurementAppointment entity);
    void Remove(MeasurementAppointment entity);
    Task SaveAsync();
}