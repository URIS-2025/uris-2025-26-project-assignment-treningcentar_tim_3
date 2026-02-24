using Microsoft.AspNetCore.Mvc;
using ReservationService.Data;
using ReservationService.Models.DTO;
using ReservationService.Models;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;

namespace ReservationService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SessionController : Controller
    {
        private readonly ISessionRepository _sessionRepository;
        private readonly IMapper _mapper;

        public SessionController(ISessionRepository sessionRepository, IMapper mapper)
        {
            _sessionRepository = sessionRepository;
            _mapper = mapper;
        }

        [HttpGet]
        [HttpHead]
        public ActionResult<IEnumerable<SessionDto>> GetAllSessions()
        {
            var sessions = _sessionRepository.GetAllSessions();
            if (sessions == null || !sessions.Any())
                return NoContent();

            return Ok(sessions);
        }

        [HttpGet("personal")]
        public ActionResult<IEnumerable<SessionDto>> GetPersonalSessions()
        {
            var sessions = _sessionRepository.GetPersonalSessions();
            if (sessions == null || !sessions.Any())
                return NoContent();

            return Ok(sessions);
        }

        [HttpGet("group")]
        public ActionResult<IEnumerable<SessionDto>> GetGroupSessions()
        {
            var sessions = _sessionRepository.GetGroupSessions();
            if (sessions == null || !sessions.Any())
                return NoContent();

            return Ok(sessions);
        }
        
        [HttpGet("range")]
        [Authorize(Roles = "Member")]
        public ActionResult<IEnumerable<SessionDto>> GetSessionsByDateRange(
            [FromQuery] DateTime from,
            [FromQuery] DateTime to,
            [FromQuery] bool? isGroup = null)
        {
            if (from > to)
                return BadRequest("'from' date must be before 'to' date.");

            var sessions = _sessionRepository.GetSessionsByDateRange(from, to, isGroup);

            if (sessions == null || !sessions.Any())
                return NoContent();

            return Ok(sessions);
        }

        [HttpGet("{id}")]
        public ActionResult<SessionDto> GetSessionById(Guid id)
        {
            var session = _sessionRepository.GetSessionById(id);
            if (session == null)
                return NotFound();

            return Ok(session);
        }

        [Authorize(Roles = nameof(UserRole.Trainer))]
        [HttpPost]
        public ActionResult<SessionDto> AddSession([FromBody] SessionCreateDTO sessionDto)
        {
            try
            {
                var newSession = _sessionRepository.AddSession(sessionDto);
                return Created(nameof(GetSessionById), newSession);
            }
            catch
            {
                return BadRequest();
            }
        }

        [Authorize(Roles = nameof(UserRole.Trainer))]
        [HttpPut]
        public ActionResult<SessionDto> UpdateSession([FromBody] SessionUpdateDTO sessionDto)
        {
            try
            {
                var existingSession = _sessionRepository.GetSessionById(sessionDto.SessionId);
                if (existingSession == null)
                    return NotFound();

                var updatedSession = _sessionRepository.UpdateSession(sessionDto);
                return Ok(updatedSession);
            }
            catch
            {
                return BadRequest();
            }
        }

        [Authorize(Roles = nameof(UserRole.Trainer))]
        [HttpDelete("{id}")]
        public IActionResult DeleteSession(Guid id)
        {
            try
            {
                var session = _sessionRepository.GetSessionById(id);
                if (session == null)
                    return NotFound();

                _sessionRepository.DeleteSession(id);
                return NoContent();
            }
            catch
            {
                return StatusCode(StatusCodes.Status500InternalServerError, "Error deleting session");
            }
        }

        [HttpOptions]
        [AllowAnonymous]
        public IActionResult GetSessionOptions()
        {
            Response.Headers.Add("Allow", "GET, POST, PUT, DELETE");
            return Ok();
        }
        
        
    }
}
