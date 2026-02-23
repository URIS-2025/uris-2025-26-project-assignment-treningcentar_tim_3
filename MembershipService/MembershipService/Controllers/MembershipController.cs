using Microsoft.AspNetCore.Mvc;
using MembershipService.Data;
using MembershipService.Models.DTO;
using MembershipService.Models;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace MembershipService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MembershipController : ControllerBase
    {
        private readonly IMembershipRepository _repository;
        private readonly IMapper _mapper;

        public MembershipController(IMembershipRepository repository, IMapper mapper)
        {
            _repository = repository;
            _mapper = mapper;
        }

        private Guid GetUserIdFromClaims()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
                throw new UnauthorizedAccessException("Invalid or missing user ID in token");
            
            return userId;
        }

        // GET: api/membership
        [HttpGet]
        public ActionResult<IEnumerable<MembershipDto>> GetMemberships()
        {
            var memberships = _repository.GetMemberships();
            return Ok(memberships);
        }

        // GET: api/membership/{id}
        [HttpGet("{id}")]
        public ActionResult<MembershipDto> GetMembershipById(Guid id)
        {
            var membership = _repository.GetMembershipById(id);
            if (membership == null)
                return NotFound();

            return Ok(membership);
        }

        // POST: api/membership
        [HttpPost]
        public ActionResult<MembershipDto> CreateMembership(CreateMembershipDto dto)
        {
            var userId = GetUserIdFromClaims();
            dto.UserId = userId;
            
            var membership = _repository.CreateMembership(dto);
            return CreatedAtAction(nameof(GetMembershipById), new { id = membership.MembershipId }, membership);
        }

        // PUT: api/membership/{id}
        [HttpPut("{id}")]
        public ActionResult<MembershipDto> UpdateMembership(Guid id, CreateMembershipDto dto)
        {
            var userId = GetUserIdFromClaims();
            dto.UserId = userId;
            
            var updatedMembership = _repository.UpdateMembership(id, dto);
            if (updatedMembership == null)
                return NotFound();

            return Ok(updatedMembership);
        }

        // DELETE: api/membership/{id}
        [HttpDelete("{id}")]
        public IActionResult DeleteMembership(Guid id)
        {
            var existingMembership = _repository.GetMembershipById(id);
            if (existingMembership == null)
                return NotFound();

            _repository.DeleteMembership(id);
            return NoContent();
        }

        // Admin endpoints
        [HttpGet("admin/expiring")]
        [Authorize(Roles = "Admin")]
        public ActionResult<IEnumerable<MembershipDto>> GetExpiringMemberships([FromQuery] int days = 30)
        {
            var memberships = _repository.GetMembershipsExpiringIn(days);
            return Ok(memberships);
        }

        [HttpGet("admin/status/{status}")]
        [Authorize(Roles = "Admin")]
        public ActionResult<IEnumerable<MembershipDto>> GetMembershipsByStatus(string status)
        {
            if (!Enum.TryParse<MembershipService.Models.Enums.MembershipStatus>(status, out var membershipStatus))
                return BadRequest("Invalid status");

            var memberships = _repository.GetMembershipsByStatus(membershipStatus);
            return Ok(memberships);
        }

        // Receptionist endpoints
        [HttpPost("checkin/manual")]
        [Authorize(Roles = "Receptionist")]
        public IActionResult RecordManualCheckin([FromBody] ManualCheckinDto dto)
        {
            try
            {
                _repository.RecordCheckin(dto.UserId, dto.Timestamp, dto.Location);
                return Ok("Check-in recorded successfully");
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("user/{userId}/status")]
        [Authorize(Roles = "Receptionist")]
        public ActionResult<MembershipDto> GetUserMembershipStatus(Guid userId)
        {
            var membership = _repository.GetUserMembership(userId);
            if (membership == null)
                return NotFound("User has no active membership");

            return Ok(membership);
        }
    }
}