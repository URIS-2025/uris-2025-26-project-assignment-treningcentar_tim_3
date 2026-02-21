using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceService.Data;
using ServiceService.Models.DTO;

namespace ServiceService.Controllers
{
    // [Authorize] ubaciti kad se uradi 
    [ApiController]
    [Route("api/service")]
    public class ServicesController : ControllerBase
    {
        private readonly IServiceRepository _serviceRepository;
        private readonly IMapper _mapper;

        public ServicesController(IServiceRepository serviceRepository, IMapper mapper)
        {
            _serviceRepository = serviceRepository;
            _mapper = mapper;
        }

        // GET: api/service/
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

        // POST: api/service/
        [HttpPost]
        public ActionResult<ServiceDTO> Create([FromBody] ServiceCreationDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var created = _serviceRepository.AddService(dto);

                return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message, detail = ex.InnerException?.Message });
            }
        }

        // PUT: api/service/{id}
        [HttpPut("{id:guid}")]
        public IActionResult Update(Guid id, [FromBody] ServiceUpdateDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                if (!_serviceRepository.ServiceExists(id))
                    return NotFound();

                _serviceRepository.UpdateService(id, dto);
                return NoContent();
            }
            catch
            {
                return BadRequest();
            }
        }

        // DELETE: api/service/{id}
        [HttpDelete("{id:guid}")]
        public IActionResult Delete(Guid id)
        {
            try
            {
                var existing = _serviceRepository.GetServiceById(id);
                if (existing == null)
                    return NotFound();

                _serviceRepository.DeleteService(id);
                return NoContent();
            }
            catch
            {
                return StatusCode(StatusCodes.Status500InternalServerError, "Delete Error");
            }
        }

        // OPTIONS: api/service
        [HttpOptions]
        [AllowAnonymous]
        public IActionResult GetOptions()
        {
            Response.Headers.Add("Allow", "GET, HEAD, POST, PUT, DELETE, OPTIONS");
            return Ok();
        }
    }
}