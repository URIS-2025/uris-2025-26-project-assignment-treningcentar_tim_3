using Microsoft.AspNetCore.Mvc;
using MembershipService.Data;
using MembershipService.Models.DTO;

namespace MembershipService.Controllers;

[ApiController]
[Route("api/packages")]
public class PackagesController : ControllerBase
{
    private readonly IPackageRepository _packageRepository;

    public PackagesController(IPackageRepository packageRepository)
    {
        _packageRepository = packageRepository;
    }

    // GET: api/packages
    [HttpGet]
    public ActionResult<IEnumerable<PackageDto>> GetAllPackages()
    {
        var packages = _packageRepository.GetAllPackages();
        return Ok(packages);
    }

    // GET: api/packages/{id}
    [HttpGet("{id:guid}")]
    public ActionResult<PackageDto> GetPackageById(Guid id)
    {
        var package = _packageRepository.GetPackageById(id);
        if (package == null)
            return NotFound($"Package with ID {id} not found.");

        return Ok(package);
    }

    // GET: api/packages/{id}/validate
    [HttpGet("{id:guid}/validate")]
    public ActionResult<bool> ValidatePackage(Guid id)
    {
        var isValid = _packageRepository.ValidatePackage(id);
        return Ok(isValid);
    }

    // PUT: api/packages/{id}
    [HttpPut("{id:guid}")]
    public ActionResult<PackageDto> UpdatePackage(Guid id, [FromBody] CreatePackageDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            var updated = _packageRepository.UpdatePackage(id, dto);
            if (updated == null)
                return NotFound($"Package with ID {id} not found.");

            return Ok(updated);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    // DELETE: api/packages/{id}
    [HttpDelete("{id:guid}")]
    public ActionResult DeletePackage(Guid id)
    {
        try
        {
            var deleted = _packageRepository.DeletePackage(id);
            if (!deleted)
                return NotFound($"Package with ID {id} not found.");

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ex.Message);
        }
    }
    
    [HttpPost]
    public ActionResult<PackageDto> CreatePackage([FromBody] CreatePackageDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            var created = _packageRepository.CreatePackage(dto);
            return CreatedAtAction(nameof(GetPackageById), new { id = created.PackageId }, created);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}