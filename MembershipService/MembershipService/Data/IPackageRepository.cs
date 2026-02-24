using MembershipService.Models.DTO;

namespace MembershipService.Data;

public interface IPackageRepository
{
    IEnumerable<PackageDto> GetAllPackages();
    PackageDto? GetPackageById(Guid id);
    bool ValidatePackage(Guid packageId);
    PackageDto? UpdatePackage(Guid id, CreatePackageDto dto);
    bool DeletePackage(Guid id);
    
    PackageDto CreatePackage(CreatePackageDto dto);
}