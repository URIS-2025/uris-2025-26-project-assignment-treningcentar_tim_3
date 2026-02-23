using AutoMapper;
using MeasurmentService.Models;
using MeasurmentService.Models.DTO;
using MeasurmentService.Repositories;
using MeasurmentService.Clients;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace MeasurmentService.Controllers;

[ApiController]
[Route("api/measurementAppointment")]
[Authorize]
public class MeasurementAppointmentsController : ControllerBase
{
    private readonly IMeasurementAppointmentRepository _repo;
    private readonly IGuidelineRepository _guidelineRepo;
    private readonly IMapper _mapper;
    private readonly ServiceServiceClient _serviceClient;

    public MeasurementAppointmentsController(
        IMeasurementAppointmentRepository repo,
        IGuidelineRepository guidelineRepo,
        IMapper mapper,
        ServiceServiceClient serviceClient)
    {
        _repo = repo;
        _guidelineRepo = guidelineRepo;
        _mapper = mapper;
        _serviceClient = serviceClient;
    }

    private Guid CurrentUserId =>
        Guid.Parse(
            User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue("sub")
            ?? throw new UnauthorizedAccessException("Missing user id claim")
        );

    private string CurrentRole
    {
        get
        {
            if (User.IsInRole("Admin")) return "Admin";
            if (User.IsInRole("Nutritionist")) return "Nutritionist";
            if (User.IsInRole("Trainer")) return "Trainer";
            if (User.IsInRole("Member")) return "Member";
            return "";
        }
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<MeasurementAppointmentDTO>>> GetAll()
    {
        if (string.IsNullOrWhiteSpace(CurrentRole)) return Forbid();

        var items = await _repo.GetAllVisibleAsync(CurrentUserId, CurrentRole);
        return Ok(items.Select(_mapper.Map<MeasurementAppointmentDTO>));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<MeasurementAppointmentDTO>> GetById(Guid id)
    {
        var item = await _repo.GetByIdAsync(id);
        if (item == null) return NotFound();

        // access check
        var userId = CurrentUserId;
        var allowed =
            User.IsInRole("Admin")
            || (User.IsInRole("Nutritionist") && item.NutritionistId == userId)
            || (User.IsInRole("Trainer") && item.EmployeeId == userId)
            || (User.IsInRole("Member") && item.MemberId == userId);

        if (!allowed) return Forbid();

        return Ok(_mapper.Map<MeasurementAppointmentDTO>(item));
    }

    // Samo Nutritionist/Admin kreira appointment
    [Authorize(Roles = "Nutritionist,Admin")]
    [HttpPost]
    public async Task<ActionResult<MeasurementAppointmentDTO>> Create([FromBody] MeasurementAppointmentCreateDTO dto)
    {
        var userId = CurrentUserId; // nutritionist/admin

        if (dto.MemberId == Guid.Empty || dto.EmployeeId == Guid.Empty)
            return BadRequest("MemberId and EmployeeId must be valid GUIDs.");

        if (dto.ServiceId.HasValue)
        {
            var exists = await _serviceClient.ServiceExistsAsync(dto.ServiceId.Value);
            if (!exists) return BadRequest("ServiceId does not exist.");
        }

        var entity = _mapper.Map<MeasurementAppointment>(dto);
        entity.NutritionistId = userId;

        await _repo.AddAsync(entity);
        await _repo.SaveAsync();

        var outDto = _mapper.Map<MeasurementAppointmentDTO>(entity);
        return CreatedAtAction(nameof(GetById), new { id = entity.AppointmentId }, outDto);
    }

    // Samo Nutritionist/Admin menja
    [Authorize(Roles = "Nutritionist,Admin")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] MeasurementAppointmentCreateDTO dto)
    {
        var userId = CurrentUserId;

        if (dto.MemberId == Guid.Empty || dto.EmployeeId == Guid.Empty)
            return BadRequest("MemberId and EmployeeId must be valid GUIDs.");

        var entity = await _repo.GetByIdAsync(id);
        if (entity == null) return NotFound();

        if (!User.IsInRole("Admin") && entity.NutritionistId != userId)
            return Forbid();

        if (dto.ServiceId.HasValue)
        {
            var exists = await _serviceClient.ServiceExistsAsync(dto.ServiceId.Value);
            if (!exists) return BadRequest("ServiceId does not exist.");
        }

        entity.MemberId = dto.MemberId;
        entity.EmployeeId = dto.EmployeeId;
        entity.Date = dto.Date;
        entity.Notes = dto.Notes;
        entity.ServiceId = dto.ServiceId;

        entity.Measurements.WeightKg = dto.WeightKg;
        entity.Measurements.HeightCm = dto.HeightCm;
        entity.Measurements.BodyFatPercent = dto.BodyFatPercent;

        await _repo.SaveAsync();
        return NoContent();
    }

    // Samo Nutritionist/Admin briše
    [Authorize(Roles = "Nutritionist,Admin")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = CurrentUserId;

        var entity = await _repo.GetByIdAsync(id);
        if (entity == null) return NotFound();

        if (!User.IsInRole("Admin") && entity.NutritionistId != userId)
            return Forbid();

        _repo.Remove(entity);
        await _repo.SaveAsync();
        return NoContent();
    }

    // Guideline se kreira samo za postojeći appointment
    [Authorize(Roles = "Nutritionist,Admin")]
    [HttpPost("{appointmentId:guid}/guidelines")]
    public async Task<ActionResult<GuidelineDTO>> CreateGuidelineForAppointment(
        Guid appointmentId,
        [FromBody] GuidelineCreateDTO dto)
    {
        var userId = CurrentUserId;

        var appt = await _repo.GetByIdAsync(appointmentId);
        if (appt == null) return NotFound("Appointment not found.");

        if (!User.IsInRole("Admin") && appt.NutritionistId != userId)
            return Forbid();

        if (appt.Guideline != null)
            return Conflict("Guideline already exists for this appointment.");

        var guideline = _mapper.Map<Guideline>(dto);
        guideline.AppointmentId = appt.AppointmentId;
        guideline.CreatedByNutritionistId = userId;
        guideline.LastUpdated = DateTime.UtcNow;

        await _guidelineRepo.AddAsync(guideline);
        await _guidelineRepo.SaveAsync();

        return CreatedAtAction(
            actionName: "GetById",
            controllerName: "Guidelines",
            routeValues: new { id = guideline.GuidelineId },
            value: _mapper.Map<GuidelineDTO>(guideline)
        );
    }
}