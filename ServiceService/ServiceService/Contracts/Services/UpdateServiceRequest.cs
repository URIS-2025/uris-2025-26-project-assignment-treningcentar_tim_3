using ServiceService.Domain.Enums;

namespace ServiceService.Contracts.Services;

public record UpdateServiceRequest(
    string Name,
    string? Description,
    decimal Price,
    ServiceCategory Category
);
