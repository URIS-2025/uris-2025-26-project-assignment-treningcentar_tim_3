using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ServiceService.Contracts.Services;
using ServiceService.Domain.Entities;
using ServiceService.Infrastructure.Persistence;

namespace ServiceService.Controllers;

[ApiController]
[Route("api/service")] 
public class ServicesController : ControllerBase
{
    private readonly ServiceDbContext _db;

    public ServicesController(ServiceDbContext db)
    {
        _db = db;
    }

    // GET: api/service
    [HttpGet]
    public async Task<ActionResult<List<ServiceResponse>>> GetAll()
    {
        var items = await _db.Services
            .AsNoTracking()
            .Select(s => new ServiceResponse(s.ServiceId, s.Name, s.Description, s.Price, s.Category))
            .ToListAsync();

        return Ok(items);
    }

    // GET: api/service/{id}
    [HttpGet("{id:int}")]
    public async Task<ActionResult<ServiceResponse>> GetById(int id)
    {
        var s = await _db.Services.AsNoTracking().FirstOrDefaultAsync(x => x.ServiceId == id);
        if (s is null) return NotFound();

        return Ok(new ServiceResponse(s.ServiceId, s.Name, s.Description, s.Price, s.Category));
    }

    // POST: api/service
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

    // PUT: api/service/{id}
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

    // DELETE: api/service/{id}
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _db.Services.FirstOrDefaultAsync(x => x.ServiceId == id);
        if (entity is null) return NotFound();

        _db.Services.Remove(entity);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // GET: api/service/{id}/cost?quantity=3
    [HttpGet("{id:int}/cost")]
    public async Task<ActionResult<decimal>> CalculateCost(int id, [FromQuery] int quantity = 1)
    {
        if (quantity <= 0) return BadRequest("Quantity must be >= 1.");

        var service = await _db.Services.AsNoTracking().FirstOrDefaultAsync(x => x.ServiceId == id);
        if (service is null) return NotFound();

        var total = service.Price * quantity;
        return Ok(total);
    }

    // GET: api/service/{id}/availability
    [HttpGet("{id:int}/availability")]
    public async Task<ActionResult<bool>> IsAvailable(int id)
    {
        var exists = await _db.Services.AsNoTracking().AnyAsync(x => x.ServiceId == id);
        if (!exists) return NotFound();

        return Ok(true);
    }
}