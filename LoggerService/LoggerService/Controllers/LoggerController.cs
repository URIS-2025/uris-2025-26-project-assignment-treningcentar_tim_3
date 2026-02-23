using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LoggerService.Data;
using LoggerService.Models.DTO;
using LoggerService.Models.Enums;

namespace LoggerService.Controllers
{
    // [Authorize] ubaciti kad se uradi
    [ApiController]
    [Route("api/logger")]
    [Produces("application/json")]
    public class LoggerController : ControllerBase
    {
        private readonly ILoggerRepository _repo;

        public LoggerController(ILoggerRepository repo)
        {
            _repo = repo;
        }

        // GET: api/logger?take=100
        [HttpGet]
        [HttpHead]
        public ActionResult<IEnumerable<LogDTO>> GetAll([FromQuery] int take = 100)
        {
            var logs = _repo.GetAll(take);
            if (logs == null || !logs.Any())
                return NoContent();

            return Ok(logs);
        }

        // GET: api/logger/{id}
        [HttpGet("{id:guid}")]
        public ActionResult<LogDTO> GetById(Guid id)
        {
            var log = _repo.GetById(id);
            if (log == null) return NotFound();
            return Ok(log);
        }

        // GET: api/logger/search?... 
        [HttpGet("search")]
        public ActionResult<IEnumerable<LogDTO>> Search(
            [FromQuery] LogLevels? level,
            [FromQuery] string? serviceName,
            [FromQuery] string? action,
            [FromQuery] Guid? entityId,
            [FromQuery] DateTime? fromUtc,
            [FromQuery] DateTime? toUtc,
            [FromQuery] int take = 100)
        {
            var result = _repo.Search(level, serviceName, action, entityId, fromUtc, toUtc, take);
            if (result == null || !result.Any())
                return NoContent();

            return Ok(result);
        }

        // POST: api/logger
        [HttpPost]
        public ActionResult<LogDTO> Create([FromBody] LogCreationDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var created = _repo.Create(dto);
                return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message, detail = ex.InnerException?.Message });
            }
        }

        // DELETE: api/logger/{id}
        [HttpDelete("{id:guid}")]
        public IActionResult Delete(Guid id)
        {
            var existing = _repo.GetById(id);
            if (existing == null) return NotFound();

            _repo.Delete(id);
            return NoContent();
        }

        // OPTIONS
        [HttpOptions]
        [AllowAnonymous]
        public IActionResult GetOptions()
        {
            Response.Headers.Add("Allow", "GET, HEAD, POST, DELETE, OPTIONS");
            return Ok();
        }
    }
}