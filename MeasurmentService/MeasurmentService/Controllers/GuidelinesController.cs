using AutoMapper;
using MeasurmentService.Context;
using MeasurmentService.Models.DTO;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;

namespace MeasurmentService.Controllers;

[Authorize]
[ApiController]
[Route("api/guidelines")]
public class GuidelinesController : ControllerBase
{
    private readonly MeasurementContext _context;
    private readonly IMapper _mapper;

    public GuidelinesController(MeasurementContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                   ?? User.FindFirst("sub")?.Value
                   ?? throw new UnauthorizedAccessException("Missing sub claim"));

    [HttpGet]
    public async Task<ActionResult<IEnumerable<GuidelineDTO>>> GetAll()
    {
        var userId = CurrentUserId;

        var q = _context.Guidelines.AsNoTracking()
            .Join(
                _context.MeasurementAppointments.AsNoTracking(),
                g => g.AppointmentId,
                a => a.AppointmentId,
                (g, a) => new { g, a }
            );

        if (!User.IsInRole("Admin"))
        {
            if (User.IsInRole("Nutritionist"))
                q = q.Where(x => x.g.CreatedByNutritionistId == userId);
            else if (User.IsInRole("Trainer"))
                q = q.Where(x => x.a.EmployeeId == userId);
            else if (User.IsInRole("Member"))
                q = q.Where(x => x.a.MemberId == userId);
            else
                return Forbid();
        }

        var items = await q.Select(x => x.g).ToListAsync();
        return Ok(items.Select(_mapper.Map<GuidelineDTO>));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<GuidelineDTO>> GetById(Guid id)
    {
        var userId = CurrentUserId;

        var data = await _context.Guidelines.AsNoTracking()
            .Join(
                _context.MeasurementAppointments.AsNoTracking(),
                g => g.AppointmentId,
                a => a.AppointmentId,
                (g, a) => new { g, a }
            )
            .FirstOrDefaultAsync(x => x.g.GuidelineId == id);

        if (data == null) return NotFound();

        var allowed =
            User.IsInRole("Admin")
            || (User.IsInRole("Nutritionist") && data.g.CreatedByNutritionistId == userId)
            || (User.IsInRole("Trainer") && data.a.EmployeeId == userId)
            || (User.IsInRole("Member") && data.a.MemberId == userId);

        if (!allowed) return Forbid();

        return Ok(_mapper.Map<GuidelineDTO>(data.g));
    }

    // Update/Delete: samo autor nutritionist (ili Admin)
    [Authorize(Roles = "Nutritionist,Admin")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] GuidelineCreateDTO dto)
    {
        var userId = CurrentUserId;

        var entity = await _context.Guidelines.FirstOrDefaultAsync(x => x.GuidelineId == id);
        if (entity == null) return NotFound();

        if (!User.IsInRole("Admin") && entity.CreatedByNutritionistId != userId)
            return Forbid();

        entity.Title = dto.Title;
        entity.Content = dto.Content;
        entity.Category = dto.Category;
        entity.LastUpdated = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [Authorize(Roles = "Nutritionist,Admin")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = CurrentUserId;

        var entity = await _context.Guidelines.FirstOrDefaultAsync(x => x.GuidelineId == id);
        if (entity == null) return NotFound();

        if (!User.IsInRole("Admin") && entity.CreatedByNutritionistId != userId)
            return Forbid();

        _context.Guidelines.Remove(entity);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // ❌ POST /api/guidelines više ne treba (guideline se pravi samo preko appointment endpointa)
}