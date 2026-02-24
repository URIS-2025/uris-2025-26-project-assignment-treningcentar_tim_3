using AutoMapper;
using MembershipService.Context;
using MembershipService.Models;
using MembershipService.Models.Enums;
using MembershipService.Models.DTO;

namespace MembershipService.Data;

public class PackageRepository : IPackageRepository
{
    private readonly MembershipContext _context;
    private readonly IMapper _mapper;

    public PackageRepository(MembershipContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public IEnumerable<PackageDto> GetAllPackages()
    {
        var packages = _context.Packages.ToList();
        return _mapper.Map<IEnumerable<PackageDto>>(packages);
    }

    public PackageDto? GetPackageById(Guid id)
    {
        var package = _context.Packages.FirstOrDefault(p => p.PackageId == id);
        return _mapper.Map<PackageDto>(package);
    }

    public bool ValidatePackage(Guid packageId)
    {
        return _context.Packages.Any(p => p.PackageId == packageId);
    }

    public PackageDto? UpdatePackage(Guid id, CreatePackageDto dto)
    {
        var package = _context.Packages.FirstOrDefault(p => p.PackageId == id);
        if (package == null)
            return null;

        if (dto.Duration <= 0)
            throw new InvalidOperationException("Package duration must be greater than 0.");

        package.Name = dto.Name;
        package.Description = dto.Description;
        package.Price = dto.Price;
        package.Duration = dto.Duration;
        package.Services = dto.Services;

        _context.SaveChanges();
        return _mapper.Map<PackageDto>(package);
    }

    public bool DeletePackage(Guid id)
    {
        var package = _context.Packages.FirstOrDefault(p => p.PackageId == id);
        if (package == null)
            return false;

        var hasActiveMemberships = _context.Memberships.Any(m => m.PackageId == id && m.Status == MembershipStatus.Active);
        if (hasActiveMemberships)
            throw new InvalidOperationException("Cannot delete package with active memberships.");

        _context.Packages.Remove(package);
        _context.SaveChanges();
        return true;
    }
    
    public PackageDto CreatePackage(CreatePackageDto dto)
    {
        if (dto.Duration <= 0)
            throw new InvalidOperationException("Package duration must be greater than 0.");

        var package = new Package
        {
            PackageId = Guid.NewGuid(),
            Name = dto.Name,
            Description = dto.Description,
            Price = dto.Price,
            Duration = dto.Duration,
            Services = dto.Services
        };

        _context.Packages.Add(package);
        _context.SaveChanges();
        return _mapper.Map<PackageDto>(package);
    }
}