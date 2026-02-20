using AutoMapper;
using MeasurmentService.Models;
using MeasurmentService.Context;
using MeasurmentService.Models.DTO;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

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

    [HttpGet]
    public async Task<ActionResult<IEnumerable<GuidelineDTO>>> GetAll()
    {
        var items = await _context.Guidelines.AsNoTracking().ToListAsync();
        return Ok(items.Select(_mapper.Map<GuidelineDTO>));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<GuidelineDTO>> GetById(int id)
    {
        var item = await _context.Guidelines.AsNoTracking()
            .FirstOrDefaultAsync(x => x.GuidelineId == id);

        if (item == null) return NotFound();
        return Ok(_mapper.Map<GuidelineDTO>(item));
    }

    [HttpPost]
    public async Task<ActionResult<GuidelineDTO>> Create([FromBody] GuidelineCreateDTO dto)
    {
        var entity = _mapper.Map<Guideline>(dto);
        entity.LastUpdated = DateTime.UtcNow;

        _context.Guidelines.Add(entity);
        await _context.SaveChangesAsync();

        var outDto = _mapper.Map<GuidelineDTO>(entity);
        return CreatedAtAction(nameof(GetById), new { id = entity.GuidelineId }, outDto);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] GuidelineCreateDTO dto)
    {
        var entity = await _context.Guidelines.FirstOrDefaultAsync(x => x.GuidelineId == id);
        if (entity == null) return NotFound();

        entity.Title = dto.Title;
        entity.Content = dto.Content;
        entity.Category = dto.Category;
        entity.LastUpdated = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _context.Guidelines.FirstOrDefaultAsync(x => x.GuidelineId == id);
        if (entity == null) return NotFound();

        _context.Guidelines.Remove(entity);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
