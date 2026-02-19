using ServiceService.Domain.Enums;

namespace ServiceService.Contracts.Services;

public record CreateServiceRequest(
    string Name,
    string? Description,
    decimal Price,
    ServiceCategory Category
);
