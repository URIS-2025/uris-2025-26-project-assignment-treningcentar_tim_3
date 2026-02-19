using ServiceService.Domain.Enums;

namespace ServiceService.Contracts.Services;

public record ServiceResponse(
    int ServiceId,
    string Name,
    string? Description,
    decimal Price,
    ServiceCategory Category
);
