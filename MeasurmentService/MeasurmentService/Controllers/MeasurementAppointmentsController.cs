using AutoMapper;
using MeasurmentService.Context;
using MeasurmentService.Models;
using MeasurmentService.Models.DTO;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;

namespace MeasurmentService.Controllers;

[ApiController]
[Route("api/measurementAppointment")]
[Authorize] // sve je iza auth-a
public class MeasurementAppointmentsController : ControllerBase
{
    private readonly MeasurementContext _context;
    private readonly IMapper _mapper;

    public MeasurementAppointmentsController(MeasurementContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                   ?? User.FindFirst("sub")?.Value
                   ?? throw new UnauthorizedAccessException("Missing sub claim"));

    // GET - vraća samo ono što user sme (Admin sve, Nutritionist svoje, Trainer svoje, Member svoje)
    [HttpGet]
    public async Task<ActionResult<IEnumerable<MeasurementAppointmentDTO>>> GetAll()
    {
        var userId = CurrentUserId;

        IQueryable<MeasurementAppointment> q = _context.MeasurementAppointments
            .AsNoTracking()
            .Include(a => a.Guideline);

        if (!User.IsInRole("Admin"))
        {
            if (User.IsInRole("Nutritionist"))
                q = q.Where(a => a.NutritionistId == userId);
            else if (User.IsInRole("Trainer"))
                q = q.Where(a => a.EmployeeId == userId);
            else if (User.IsInRole("Member"))
                q = q.Where(a => a.MemberId == userId);
            else
                return Forbid();
        }

        var items = await q.ToListAsync();
        return Ok(items.Select(_mapper.Map<MeasurementAppointmentDTO>));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<MeasurementAppointmentDTO>> GetById(Guid id)
    {
        var userId = CurrentUserId;

        var item = await _context.MeasurementAppointments.AsNoTracking()
            .Include(a => a.Guideline)
            .FirstOrDefaultAsync(x => x.AppointmentId == id);

        if (item == null) return NotFound();

        var allowed =
            User.IsInRole("Admin")
            || (User.IsInRole("Nutritionist") && item.NutritionistId == userId)
            || (User.IsInRole("Trainer") && item.EmployeeId == userId)
            || (User.IsInRole("Member") && item.MemberId == userId);

        if (!allowed) return Forbid();

        return Ok(_mapper.Map<MeasurementAppointmentDTO>(item));
    }

    // Samo Nutritionist zakazuje appointment
    [Authorize(Roles = "Nutritionist,Admin")]
    [HttpPost]
    public async Task<ActionResult<MeasurementAppointmentDTO>> Create([FromBody] MeasurementAppointmentCreateDTO dto)
    {
        var userId = CurrentUserId; // nutritionist

        if (dto.MemberId == Guid.Empty || dto.EmployeeId == Guid.Empty)
            return BadRequest("MemberId and EmployeeId must be valid GUIDs.");

        var entity = _mapper.Map<MeasurementAppointment>(dto);
        entity.NutritionistId = userId;

        _context.MeasurementAppointments.Add(entity);
        await _context.SaveChangesAsync();

        var outDto = _mapper.Map<MeasurementAppointmentDTO>(entity);
        return CreatedAtAction(nameof(GetById), new { id = entity.AppointmentId }, outDto);
    }

    // Nutritionist može da menja samo svoje appointment-e (Admin sve)
    [Authorize(Roles = "Nutritionist,Admin")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] MeasurementAppointmentCreateDTO dto)
    {
        var userId = CurrentUserId;

        var entity = await _context.MeasurementAppointments
            .Include(a => a.Guideline)
            .FirstOrDefaultAsync(x => x.AppointmentId == id);

        if (entity == null) return NotFound();

        if (!User.IsInRole("Admin") && entity.NutritionistId != userId)
            return Forbid();

        entity.MemberId = dto.MemberId;
        entity.EmployeeId = dto.EmployeeId;
        entity.Date = dto.Date;
        entity.Notes = dto.Notes;
        entity.ServiceId = dto.ServiceId;

        entity.Measurements.WeightKg = dto.WeightKg;
        entity.Measurements.HeightCm = dto.HeightCm;
        entity.Measurements.BodyFatPercent = dto.BodyFatPercent;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [Authorize(Roles = "Nutritionist,Admin")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = CurrentUserId;

        var entity = await _context.MeasurementAppointments.FirstOrDefaultAsync(x => x.AppointmentId == id);
        if (entity == null) return NotFound();

        if (!User.IsInRole("Admin") && entity.NutritionistId != userId)
            return Forbid();

        _context.MeasurementAppointments.Remove(entity);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // ✅ Ovo je ključni endpoint: guideline se pravi samo za appointment
    [Authorize(Roles = "Nutritionist,Admin")]
    [HttpPost("{appointmentId:guid}/guidelines")]
    public async Task<ActionResult<GuidelineDTO>> CreateGuidelineForAppointment(Guid appointmentId, [FromBody] GuidelineCreateDTO dto)
    {
        var userId = CurrentUserId;

        var appt = await _context.MeasurementAppointments
            .Include(a => a.Guideline)
            .FirstOrDefaultAsync(a => a.AppointmentId == appointmentId);

        if (appt == null) return NotFound("Appointment not found.");

        // Samo nutritionist koji je zakazao (Admin sve)
        if (!User.IsInRole("Admin") && appt.NutritionistId != userId)
            return Forbid();

        if (appt.Guideline != null)
            return Conflict("Guideline already exists for this appointment.");

        var guideline = _mapper.Map<Guideline>(dto);
        guideline.AppointmentId = appt.AppointmentId;
        guideline.CreatedByNutritionistId = userId;
        guideline.LastUpdated = DateTime.UtcNow;

        _context.Guidelines.Add(guideline);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            actionName: "GetById",
            controllerName: "Guidelines",
            routeValues: new { id = guideline.GuidelineId },
            value: _mapper.Map<GuidelineDTO>(guideline)
        );
    }
}