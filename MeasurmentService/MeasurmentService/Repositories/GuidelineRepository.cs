using MeasurmentService.Data;
using MeasurmentService.Models;
using Microsoft.EntityFrameworkCore;

namespace MeasurmentService.Repositories;

public class GuidelineRepository : IGuidelineRepository
{
    private readonly MeasurementContext _context;
    public GuidelineRepository(MeasurementContext context) => _context = context;

    public Task<Guideline?> GetByIdAsync(Guid id) =>
       _context.Guidelines.FirstOrDefaultAsync(x => x.GuidelineId == id);

    public async Task<List<Guideline>> GetAllVisibleAsync(Guid userId, string role)
    {
        var q = _context.Guidelines.AsNoTracking()
            .Join(_context.MeasurementAppointments.AsNoTracking(),
                g => g.AppointmentId,
                a => a.AppointmentId,
                (g, a) => new { g, a });

        var filtered = role switch
        {
            "Admin" => q,
            "Nutritionist" => q.Where(x => x.g.CreatedByNutritionistId == userId),
            "Trainer" => q.Where(x => x.a.EmployeeId == userId),
            "Member" => q.Where(x => x.a.MemberId == userId),
            _ => q.Where(_ => false)
        };

        return await filtered.Select(x => x.g).ToListAsync();
    }

    public async Task AddAsync(Guideline entity) =>
        await _context.Guidelines.AddAsync(entity);

    public void Remove(Guideline entity) =>
        _context.Guidelines.Remove(entity);

    public Task SaveAsync() => _context.SaveChangesAsync();
}