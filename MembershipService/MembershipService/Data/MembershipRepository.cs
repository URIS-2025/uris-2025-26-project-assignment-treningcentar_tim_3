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
}