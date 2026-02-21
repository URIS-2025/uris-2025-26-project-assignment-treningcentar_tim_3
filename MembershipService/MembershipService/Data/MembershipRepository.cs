using AutoMapper;
using Microsoft.EntityFrameworkCore;
using MembershipService.Context;
using MembershipService.Models;
using MembershipService.Models.Enums;
using MembershipService.Models.DTO;

namespace MembershipService.Data;

public class MembershipRepository : IMembershipRepository
{
    private readonly MembershipContext _context;
    private readonly IMapper _mapper;

    public MembershipRepository(MembershipContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public bool SaveChanges()
    {
        return _context.SaveChanges() > 0;
    }


    public IEnumerable<MembershipDto> GetMemberships()
    {
        var memberships = _context.Memberships.ToList();
        return _mapper.Map<IEnumerable<MembershipDto>>(memberships);
    }

    
    public MembershipDto? GetMembershipById(Guid id)
    {
        var membership = _context.Memberships.FirstOrDefault(m => m.MembershipId == id);
        return _mapper.Map<MembershipDto>(membership);
    }

    public MembershipDto CreateMembership(CreateMembershipDto dto)
    {
        if (_context.Memberships.Any(m => m.UserId == dto.UserId))
        {
            throw new InvalidOperationException("User already has an active membership.");
        }
        
        var membership = new Membership
        {
            UserId = dto.UserId,
            PackageId = dto.PackageId,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
        
            Status = MembershipStatus.Active 
        };

        _context.Memberships.Add(membership);
        _context.SaveChanges();

        
        return _mapper.Map<MembershipDto>(membership);
    }

    public MembershipDto? UpdateMembership(Guid id, CreateMembershipDto dto)
    {
        var membership = _context.Memberships.FirstOrDefault(m => m.MembershipId == id);
        if (membership == null)
            throw new InvalidOperationException("Membership not found.");

        // Validacija prelaza statusa 
        var currentStatus = membership.Status;
        var nextStatus = dto.Status;

        // Ne može se reaktivirati članarina koja je ručno otkazana (Canceled)
    
        if (currentStatus == MembershipStatus.Cancelled && nextStatus == MembershipStatus.Active)
        {
            throw new InvalidOperationException("Cannot reactivate cancelled membership.");
        }

        membership.UserId = dto.UserId;
        membership.PackageId = dto.PackageId;
        membership.StartDate = dto.StartDate;
        membership.EndDate = dto.EndDate;
        membership.Status = nextStatus;

        _context.SaveChanges();

        return _mapper.Map<MembershipDto>(membership);
    }

    public void DeleteMembership(Guid id)
    {
        var membership = _context.Memberships.FirstOrDefault(m => m.MembershipId == id);
        if (membership != null)
        {
            _context.Memberships.Remove(membership);
            _context.SaveChanges();
        }
    }

    // Membership queries/admin
    public MembershipDto? GetUserMembership(Guid userId)
    {
        var membership = _context.Memberships.FirstOrDefault(m => m.UserId == userId && m.Status == MembershipStatus.Active);
        return _mapper.Map<MembershipDto>(membership);
    }

    public IEnumerable<MembershipDto> GetMembershipsByStatus(MembershipStatus status)
    {
        var memberships = _context.Memberships.Where(m => m.Status == status).ToList();
        return _mapper.Map<IEnumerable<MembershipDto>>(memberships);
    }

    public IEnumerable<MembershipDto> GetMembershipsExpiringIn(int days)
    {
        var targetDate = DateTime.UtcNow.AddDays(days);
        var memberships = _context.Memberships
            .Where(m => m.EndDate <= targetDate && m.Status == MembershipStatus.Active)
            .ToList();
        return _mapper.Map<IEnumerable<MembershipDto>>(memberships);
    }

    public IEnumerable<MembershipDto> GetAllMemberships()
    {
        var memberships = _context.Memberships.ToList();
        return _mapper.Map<IEnumerable<MembershipDto>>(memberships);
    }

    public void DeactivateMembership(Guid id)
    {
        var membership = _context.Memberships.FirstOrDefault(m => m.MembershipId == id);
        if (membership != null)
        {
            membership.Status = MembershipStatus.Suspended;
            _context.SaveChanges();
        }
    }

    public bool ExtendMembership(Guid id, int durationDays)
    {
        var membership = _context.Memberships.FirstOrDefault(m => m.MembershipId == id);
        if (membership == null)
            return false;

        if (membership.Renew(durationDays))
        {
            _context.SaveChanges();
            return true;
        }
        return false;
    }

    // Package operations
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

    // Checkin operations
    public void RecordCheckin(Guid userId, DateTime timestamp, string location)
    {
        var membership = _context.Memberships.FirstOrDefault(m => m.UserId == userId && m.Status == MembershipStatus.Active);
        if (membership == null)
            throw new InvalidOperationException("User does not have an active membership.");

        var todayCheckin = _context.Checkins.Any(c => c.MembershipId == membership.MembershipId && 
            c.Timestamp.Date == timestamp.Date);
        if (todayCheckin)
            throw new InvalidOperationException("User has already checked in today.");

        var checkin = new Checkin
        {
            CheckinId = Guid.NewGuid(),
            MembershipId = membership.MembershipId,
            Timestamp = timestamp,
            Location = location
        };

        _context.Checkins.Add(checkin);
        _context.SaveChanges();
    }

    public IEnumerable<CheckinDto> GetCheckinHistory(Guid userId, DateTime? startDate = null, DateTime? endDate = null)
    {
        var query = _context.Checkins
            .Where(c => c.Membership != null && c.Membership.UserId == userId);

        if (startDate.HasValue)
            query = query.Where(c => c.Timestamp >= startDate.Value);

        if (endDate.HasValue)
            query = query.Where(c => c.Timestamp <= endDate.Value);

        var checkins = query.OrderByDescending(c => c.Timestamp).ToList();
        return _mapper.Map<IEnumerable<CheckinDto>>(checkins);
    }

    public bool PreventDuplicateCheckinSameDay(Guid userId)
    {
        return !_context.Checkins.Any(c => c.Membership != null && 
            c.Membership.UserId == userId && 
            c.Timestamp.Date == DateTime.UtcNow.Date);
    }

    public bool ValidateMembershipForCheckin(Guid userId)
    {
        var membership = _context.Memberships.FirstOrDefault(m => m.UserId == userId && m.Status == MembershipStatus.Active);
        return membership != null && membership.IsActive();
    }
}