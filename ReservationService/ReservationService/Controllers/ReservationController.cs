using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using ReservationService.Data;
using ReservationService.Models;
using ReservationService.Models.DTO;

namespace ReservationService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReservationController : ControllerBase
    {
        private readonly IReservationRepository _repo;
        private readonly IMapper _mapper;

        public ReservationController(IReservationRepository repo, IMapper mapper)
        {
            _repo = repo;
            _mapper = mapper;
        }

        /// <summary>
        /// Vraca sve rezervacije.
        /// </summary>
        /// <returns>Lista rezervacija.</returns>
        /// <response code="200">Uspesno vraca listu rezervacija.</response>
        /// <response code="204">Nije pronadjena nijedna rezervacija.</response>
        [HttpGet]
        [HttpHead]
        public ActionResult<IEnumerable<ReservationDto>> GetAll()
        {
            var reservations = _repo.GetAllReservations();
            if (reservations == null || !reservations.Any())
                return NoContent();

            return Ok(reservations);
        }

        /// <summary>
        /// Vraca rezervaciju na osnovu ID-ja.
        /// </summary>
        /// <param name="id">ID rezervacije</param>
        /// <returns>Rezervacija.</returns>
        /// <response code="200">Uspesno vraca rezervaciju.</response>
        /// <response code="404">Nije pronadjena rezervacija.</response>
        [HttpGet("{id}")]
        public ActionResult<ReservationDto> GetById(Guid id)
        {
            var reservation = _repo.GetReservationById(id);
            if (reservation == null)
                return NotFound();

            return Ok(reservation);
        }

        /// <summary>
        /// Kreira novu rezervaciju.
        /// </summary>
        /// <param name="dto">Model za kreiranje rezervacije</param>
        /// <returns>Potvrdu o kreiranoj rezervaciji.</returns>
        /// <response code="201">Vraca kreiranu rezervaciju.</response>
        /// <response code="400">Doslo je do greske prilikom kreiranja rezervacije.</response>
        [HttpPost]
        public ActionResult<ReservationConfirmationDto> Create([FromBody] ReservationCreateDto dto)
        {
            try
            {
                var confirmation = _repo.CreateReservation(dto);
                return Created("", confirmation);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch
            {
                return BadRequest();
            }
        }

        /// <summary>
        /// Azurira postojecu rezervaciju.
        /// </summary>
        /// <param name="id">ID rezervacije</param>
        /// <param name="reservation">Model rezervacije</param>
        /// <returns>Potvrdu o azuriranoj rezervaciji.</returns>
        /// <response code="200">Vraca azuriranu rezervaciju.</response>
        /// <response code="404">Nije pronadjena rezervacija.</response>
        /// <response code="400">Doslo je do greske prilikom azuriranja rezervacije.</response>
        [HttpPut("{id}")]
        public ActionResult<ReservationConfirmationDto> Update(Guid id, [FromBody] ReservationUpdateDto dto)
        {
            try
            {
                var reservationToCheck = _repo.GetReservationById(id);
                if (reservationToCheck == null)
                    return NotFound();
                
                var confirmation = _repo.UpdateReservation(dto);
                return Ok(confirmation);
            }
            catch
            {
                return BadRequest();
            }
        }

        /// <summary>
        /// Brise rezervaciju.
        /// </summary>
        /// <param name="id">ID rezervacije</param>
        /// <returns>Status 204 (NoContent)</returns>
        /// <response code="204">Uspesno obrisana rezervacija.</response>
        /// <response code="404">Nije pronadjena rezervacija.</response>
        /// <response code="500">Greska prilikom brisanja.</response>
        [HttpDelete("{id}")]
        public IActionResult Delete(Guid id)
        {
            try
            {
                var reservation = _repo.GetReservationById(id);
                if (reservation == null)
                    return NotFound();

                _repo.DeleteReservation(id);
                return NoContent();
            }
            catch
            {
                return StatusCode(StatusCodes.Status500InternalServerError, "Delete Error");
            }
        }

        /// <summary>
        /// Vraca opcije za rad sa rezervacijama.
        /// </summary>
        [HttpOptions]
        public IActionResult GetReservationOptions()
        {
            Response.Headers.Add("Allow", "GET, POST, PUT, DELETE");
            return Ok();
        }
    }
}