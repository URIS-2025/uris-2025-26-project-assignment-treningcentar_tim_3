using MeasurmentService.Data;
using MeasurmentService.Models;
using Microsoft.EntityFrameworkCore;

namespace MeasurmentService.Repositories;

public class MeasurementAppointmentRepository : IMeasurementAppointmentRepository
{
    private readonly MeasurementContext _context;
    public MeasurementAppointmentRepository(MeasurementContext context) => _context = context;

    public async Task<List<MeasurementAppointment>> GetAllVisibleAsync(Guid userId, string role)
    {
        IQueryable<MeasurementAppointment> q = _context.MeasurementAppointments
            .AsNoTracking()
            .Include(a => a.Guideline);

        return role switch
        {
            "Admin" => await q.ToListAsync(),
            "Nutritionist" => await q.Where(a => a.NutritionistId == userId).ToListAsync(),
            "Trainer" => await q.Where(a => a.EmployeeId == userId).ToListAsync(),
            "Member" => await q.Where(a => a.MemberId == userId).ToListAsync(),
            _ => new List<MeasurementAppointment>()
        };
    }

    public Task<MeasurementAppointment?> GetByIdAsync(Guid id) =>
        _context.MeasurementAppointments
            .Include(a => a.Guideline)
            .FirstOrDefaultAsync(x => x.AppointmentId == id);

    public async Task AddAsync(MeasurementAppointment entity) =>
        await _context.MeasurementAppointments.AddAsync(entity);

    public void Remove(MeasurementAppointment entity) =>
        _context.MeasurementAppointments.Remove(entity);

    public Task SaveAsync() => _context.SaveChangesAsync();
}