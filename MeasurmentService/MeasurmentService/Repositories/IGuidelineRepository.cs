using MeasurmentService.Models;

namespace MeasurmentService.Repositories;

public interface IGuidelineRepository
{
    Task<List<Guideline>> GetAllVisibleAsync(Guid userId, string role);
    Task<Guideline?> GetByIdAsync(Guid id);

    Task AddAsync(Guideline entity);
    void Remove(Guideline entity);
    Task SaveAsync();
}