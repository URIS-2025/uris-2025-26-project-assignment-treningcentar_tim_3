using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MeasurmentService.Context;
using MeasurmentService.Models;
using MeasurmentService.Models.DTO;

namespace MeasurmentService.Controllers;

[ApiController]
[Route("api/measurementAppointment")]
public class MeasurementAppointmentsController : ControllerBase
{
    private readonly MeasurementContext _context;
    private readonly IMapper _mapper;

    public MeasurementAppointmentsController(MeasurementContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<MeasurementAppointmentDTO>>> GetAll()
    {
        var items = await _context.MeasurementAppointments.AsNoTracking().ToListAsync();
        return Ok(items.Select(_mapper.Map<MeasurementAppointmentDTO>));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<MeasurementAppointmentDTO>> GetById(int id)
    {
        var item = await _context.MeasurementAppointments.AsNoTracking()
            .FirstOrDefaultAsync(x => x.AppointmentId == id);

        if (item == null) return NotFound();
        return Ok(_mapper.Map<MeasurementAppointmentDTO>(item));
    }

    [HttpPost]
    public async Task<ActionResult<MeasurementAppointmentDTO>> Create([FromBody] MeasurementAppointmentCreateDTO dto)
    {
        // (opciono) validacije
        if (dto.MemberId <= 0 || dto.EmployeeId <= 0) return BadRequest("MemberId/EmployeeId must be > 0.");

        if (dto.GuidelineId.HasValue)
        {
            var exists = await _context.Guidelines.AnyAsync(g => g.GuidelineId == dto.GuidelineId.Value);
            if (!exists) return BadRequest("GuidelineId does not exist.");
        }

        var entity = _mapper.Map<MeasurementAppointment>(dto);

        _context.MeasurementAppointments.Add(entity);
        await _context.SaveChangesAsync();

        var outDto = _mapper.Map<MeasurementAppointmentDTO>(entity);
   
        return CreatedAtAction(nameof(GetById), new { id = entity.AppointmentId }, outDto);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] MeasurementAppointmentCreateDTO dto)
    {
        var entity = await _context.MeasurementAppointments.FirstOrDefaultAsync(x => x.AppointmentId == id);
        if (entity == null) return NotFound();

        entity.MemberId = dto.MemberId;
        entity.EmployeeId = dto.EmployeeId;
        entity.Date = dto.Date;
        entity.Notes = dto.Notes;
        entity.ServiceId = dto.ServiceId;
        entity.GuidelineId = dto.GuidelineId;

        entity.Measurements.WeightKg = dto.WeightKg;
        entity.Measurements.HeightCm = dto.HeightCm;
        entity.Measurements.BodyFatPercent = dto.BodyFatPercent;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _context.MeasurementAppointments.FirstOrDefaultAsync(x => x.AppointmentId == id);
        if (entity == null) return NotFound();

        _context.MeasurementAppointments.Remove(entity);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}