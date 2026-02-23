using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceService.Data;
using ServiceService.Models.DTO;
using ServiceService.ServiceCalls.Logger;
using ServiceService.ServiceCalls.Logger.DTO;

namespace ServiceService.Controllers
{
    // [Authorize] ubaciti kad se uradi 
    [ApiController]
    [Route("api/service")]
    public class ServicesController : ControllerBase
    {
        private readonly IServiceRepository _serviceRepository;
        private readonly IMapper _mapper;
        private readonly ILoggerService _logger;

        public ServicesController(
            IServiceRepository serviceRepository,
            IMapper mapper,
            ILoggerService logger)
        {
            _serviceRepository = serviceRepository;
            _mapper = mapper;
            _logger = logger;
        }

        // GET: api/service
        [HttpGet]
        [HttpHead]
        public ActionResult<IEnumerable<ServiceDTO>> GetAll()
        {
            var services = _serviceRepository.GetServices();
            if (services == null || !services.Any())
                return NoContent();

            return Ok(services);
        }

        // GET: api/service/{id}
        [HttpGet("{id:guid}")]
        public ActionResult<ServiceDTO> GetById(Guid id)
        {
            var service = _serviceRepository.GetServiceById(id);
            if (service == null)
                return NotFound();

            return Ok(service);
        }

        // POST: api/service
        [HttpPost]
        public async Task<ActionResult<ServiceDTO>> Create([FromBody] ServiceCreationDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var created = _serviceRepository.AddService(dto);

                // LOG - CREATE
                await _logger.TryLogAsync(new LogCreationDTO
                {
                    Level = LogLevels.Info,
                    ServiceName = "ServiceService",
                    Action = "Service.Created",
                    EntityType = "Service",
                    EntityId = created.Id,
                    Message = $"Service '{created.Name}' created"
                });

                return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
            }
            catch (Exception ex)
            {
                await _logger.TryLogAsync(new LogCreationDTO
                {
                    Level = LogLevels.Error,
                    ServiceName = "ServiceService",
                    Action = "Service.CreateFailed",
                    Message = "Failed to create service",
                    Details = ex.Message
                });

                return BadRequest(new { error = ex.Message });
            }
        }

        // PUT: api/service/{id}
        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] ServiceUpdateDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var existing = _serviceRepository.GetServiceById(id);
            if (existing == null)
                return NotFound();

            _serviceRepository.UpdateService(id, dto);

            // LOG - UPDATE
            await _logger.TryLogAsync(new LogCreationDTO
            {
                Level = LogLevels.Info,
                ServiceName = "ServiceService",
                Action = "Service.Updated",
                EntityType = "Service",
                EntityId = id,
                Message = $"Service '{dto.Name}' updated"
            });

            return NoContent();
        }

        // DELETE: api/service/{id}
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var existing = _serviceRepository.GetServiceById(id);
            if (existing == null)
                return NotFound();

            _serviceRepository.DeleteService(id);

            // LOG - DELETE
            await _logger.TryLogAsync(new LogCreationDTO
            {
                Level = LogLevels.Warning,
                ServiceName = "ServiceService",
                Action = "Service.Deleted",
                EntityType = "Service",
                EntityId = id,
                Message = $"Service '{existing.Name}' deleted"
            });

            return NoContent();
        }

        // OPTIONS
        [HttpOptions]
        [AllowAnonymous]
        public IActionResult GetOptions()
        {
            Response.Headers.Add("Allow", "GET, HEAD, POST, PUT, DELETE, OPTIONS");
            return Ok();
        }
    }
}