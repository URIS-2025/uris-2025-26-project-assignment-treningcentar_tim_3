using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ServiceService.Contracts.Services;
using ServiceService.Domain.Entities;
using ServiceService.Infrastructure.Persistence;

namespace ServiceService.Controllers;

[ApiController]
[Route("api/services")]
public class ServicesController : ControllerBase
{
    private readonly ServiceDbContext _db;

    public ServicesController(ServiceDbContext db)
    {
        _db = db;
    }

    // GET: api/services
    [HttpGet]
    public async Task<ActionResult<List<ServiceResponse>>> GetAll()
    {
        var items = await _db.Services
            .AsNoTracking()
            .Select(s => new ServiceResponse(s.ServiceId, s.Name, s.Description, s.Price, s.Category))
            .ToListAsync();

        return Ok(items);
    }

    // GET: api/services/5
    [HttpGet("{id:int}")]
    public async Task<ActionResult<ServiceResponse>> GetById(int id)
    {
        var s = await _db.Services.AsNoTracking().FirstOrDefaultAsync(x => x.ServiceId == id);
        if (s is null) return NotFound();

        return Ok(new ServiceResponse(s.ServiceId, s.Name, s.Description, s.Price, s.Category));
    }

    // POST: api/services
    [HttpPost]
    public async Task<ActionResult<ServiceResponse>> Create([FromBody] CreateServiceRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Name)) return BadRequest("Name is required.");
        if (req.Price < 0) return BadRequest("Price must be >= 0.");

        var entity = new Service
        {
            Name = req.Name.Trim(),
            Description = string.IsNullOrWhiteSpace(req.Description) ? null : req.Description.Trim(),
            Price = req.Price,
            Category = req.Category
        };

        _db.Services.Add(entity);
        await _db.SaveChangesAsync();

        var res = new ServiceResponse(entity.ServiceId, entity.Name, entity.Description, entity.Price, entity.Category);
        return CreatedAtAction(nameof(GetById), new { id = entity.ServiceId }, res);
    }

    // PUT: api/services/5
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateServiceRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Name)) return BadRequest("Name is required.");
        if (req.Price < 0) return BadRequest("Price must be >= 0.");

        var entity = await _db.Services.FirstOrDefaultAsync(x => x.ServiceId == id);
        if (entity is null) return NotFound();

        entity.Name = req.Name.Trim();
        entity.Description = string.IsNullOrWhiteSpace(req.Description) ? null : req.Description.Trim();
        entity.Price = req.Price;
        entity.Category = req.Category;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    // DELETE: api/services/5
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _db.Services.FirstOrDefaultAsync(x => x.ServiceId == id);
        if (entity is null) return NotFound();

        _db.Services.Remove(entity);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
